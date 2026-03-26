import { getBusinessDays } from "@/app/utils/dateUtils";
import { NotificationMessage } from "@/constants/notificationTemplates";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  AbsenceOverlapError,
  AuthenticationError,
  AuthorizationError,
  InvalidDateRangeError,
  RecordNotFoundError,
  ValidationError,
  WorkHoursConflictError,
} from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { sendLeaveDecisionEmailToEmployee, sendLeaveRequestEmailToAdmins } from "@/lib/email";
import { notifyUser, notifyUsersByRole } from "@/lib/notificationsLib";
import { NotificationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type AbsenceTypeValue =
  | "VACATION"
  | "SICK"
  | "PERSONAL"
  | "PARENTAL"
  | "MARRIAGE"
  | "BEREAVEMENT";
type AbsenceStatusValue = "PENDING" | "APPROVED" | "REJECTED";

const ABSENCE_TYPES: AbsenceTypeValue[] = [
  "VACATION",
  "SICK",
  "PERSONAL",
  "PARENTAL",
  "MARRIAGE",
  "BEREAVEMENT",
];
const ABSENCE_STATUSES: AbsenceStatusValue[] = ["PENDING", "APPROVED", "REJECTED"];

function isAbsenceType(value: string): value is AbsenceTypeValue {
  return ABSENCE_TYPES.includes(value as AbsenceTypeValue);
}

function isAbsenceStatus(value: string): value is AbsenceStatusValue {
  return ABSENCE_STATUSES.includes(value as AbsenceStatusValue);
}

function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function niceDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getTodayUtcStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

function isBackdatedRange(endDate: Date): boolean {
  return endDate < getTodayUtcStart();
}

async function getRequesterOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError("Unauthorized");
  }

  const requester = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { id: true, username: true, role: true, isActive: true },
  });

  if (!requester?.isActive) {
    throw new AuthorizationError("Forbidden");
  }

  return requester;
}

function parseDateRange(startDate: string, endDate: string) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    throw new ValidationError("Invalid date format. Expected YYYY-MM-DD", "startDate/endDate");
  }

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (start > end) {
    throw new InvalidDateRangeError();
  }

  return { start, end };
}

export async function POST(req: Request) {
  try {
    const requester = await getRequesterOrThrow();

    const body = await req.json();
    const { startDate, endDate, type, userId, status } = body;

    if (!startDate || !endDate || !type) {
      throw new ValidationError("Missing required fields", "startDate/endDate/type");
    }
    if (!isAbsenceType(type)) {
      throw new ValidationError("Invalid absence type", "type");
    }

    if (typeof status === "string" && !isAbsenceStatus(status)) {
      throw new ValidationError("Invalid absence status", "status");
    }
    if (status === "REJECTED") {
      throw new ValidationError("New requests cannot be created with REJECTED status", "status");
    }
    const requestedStatus: AbsenceStatusValue = status === "PENDING" ? "PENDING" : "APPROVED";

    const targetUserId = Number(userId ?? requester.id);
    if (!Number.isFinite(targetUserId)) {
      throw new ValidationError("Invalid user id", "userId");
    }

    if (requester.role !== "Admin" && targetUserId !== requester.id) {
      throw new AuthorizationError("You can only request leave for yourself");
    }
    if (requester.role !== "Admin" && requestedStatus !== "PENDING") {
      throw new AuthorizationError("Only administrators can directly approve leave");
    }

    const { start, end } = parseDateRange(startDate, endDate);
    const startIso = start.toISOString().split("T")[0];
    const endIso = end.toISOString().split("T")[0];

    const employee = await db.user.findFirst({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        username: true,
        locationId: true,
      },
    });

    if (!employee) {
      throw new RecordNotFoundError("Employee", targetUserId);
    }

    const [holidays, previousAbsences, existingWorkHours] = await Promise.all([
      db.holidays.findMany({
        where: {
          locationId: employee.locationId,
          date: {
            gte: startIso,
            lte: endIso,
          },
        },
        select: { date: true },
      }),
      db.absence.findMany({
        where: {
          userId: targetUserId,
          status: { in: ["PENDING", "APPROVED"] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      }),
      db.workHours.findFirst({
        where: {
          userId: targetUserId,
          date: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          date: true,
        },
      }),
    ]);

    if (existingWorkHours && !isBackdatedRange(end)) {
      const selectedRange = `${niceDate(start)} to ${niceDate(end)}`;
      throw new WorkHoursConflictError(selectedRange);
    }

    if (previousAbsences.length) {
      const selectedRange = `${niceDate(start)} to ${niceDate(end)}`;
      const existingAbsences = previousAbsences
        .map((a) => `[${a.status}/${a.type}: ${niceDate(a.startDate)} - ${niceDate(a.endDate)}]`)
        .join(", ");
      throw new AbsenceOverlapError(existingAbsences, selectedRange);
    }

    const holidayDates = holidays.map((h) => h.date);
    const businessDays = getBusinessDays(start, end, holidayDates);
    if (businessDays <= 0) {
      throw new ValidationError("Selected range does not contain business days", "startDate/endDate");
    }

    const newAbsence = await db.absence.create({
      data: {
        startDate: start,
        endDate: end,
        days: businessDays,
        type: type as any,
        status: requestedStatus,
        userId: targetUserId,
        reviewedById: requestedStatus === "APPROVED" ? requester.id : null,
        reviewedAt: requestedStatus === "APPROVED" ? new Date() : null,
      },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    const startLabel = formatDate(start);
    const endLabel = formatDate(end);
    const sendAdminLeaveNotificationEmail = async () => {
      try {
        const adminUsers = await db.user.findMany({
          where: {
            isActive: true,
            email: { not: null },
          },
          select: { email: true, role: true },
        });
        const adminEmails = adminUsers
          .filter((user) => typeof user.role === "string" && user.role.trim().toLowerCase() === "admin")
          .map((user) => user.email)
          .filter((email): email is string => !!email && email.trim() !== "");

        const emailResult = await sendLeaveRequestEmailToAdmins(adminEmails, {
          employeeName: newAbsence.user.username,
          leaveType: type,
          startDate: startLabel,
          endDate: endLabel,
          businessDays,
        });

        if (!emailResult.success) {
          console.error(`Failed to send leave request emails to admins. Failed: ${emailResult.failed}`);
        }
      } catch (emailError) {
        // Keep absence creation successful even if email fails.
        console.error("Error sending leave request email notifications:", emailError);
      }
    };

    if (requestedStatus === "PENDING") {
      await notifyUsersByRole({
        role: "Admin",
        title: "Leave Request Pending",
        message: NotificationMessage.AbsenceRequested(newAbsence.user.username, type, startLabel, endLabel),
        type: NotificationType.APPROVAL_REQUEST,
        actionType: "VIEW_ABSENCE",
        senderUserId: targetUserId,
        actionData: { startDate: start.toISOString() },
      });
      await sendAdminLeaveNotificationEmail();

      await notifyUser(targetUserId, {
        title: "Leave Request Submitted",
        message:
          requester.id === targetUserId
            ? `Your ${type} request from ${startLabel} to ${endLabel} is pending review.`
            : `${requester.username} submitted a ${type} leave request for you from ${startLabel} to ${endLabel}.`,
        type: NotificationType.INFO,
        actionType: "VIEW_ABSENCE",
        senderUserId: requester.id,
        actionData: { startDate: start.toISOString() },
      });

      return NextResponse.json(
        {
          absence: newAbsence,
          message: `${businessDays} day request submitted and waiting for admin review.`,
        },
        { status: 201 }
      );
    }

    await notifyUsersByRole({
      role: "Admin",
      title: "Absence Approved",
      message: NotificationMessage.AbsenceApproved(newAbsence.user.username, startLabel, endLabel),
      type: NotificationType.INFO,
      actionType: "VIEW_ABSENCE",
      senderUserId: targetUserId,
      actionData: { startDate: start.toISOString() },
    });

    await notifyUser(targetUserId, {
      title: "Absence Approved",
      message: NotificationMessage.AbsenceApproved(newAbsence.user.username, startLabel, endLabel),
      type: NotificationType.INFO,
      actionType: "VIEW_ABSENCE",
      senderUserId: requester.id,
      actionData: { startDate: start.toISOString() },
    });
    await sendAdminLeaveNotificationEmail();

    return NextResponse.json(
      { absence: newAbsence, message: `${businessDays} days off successfully granted to ${employee.username}.` },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function GET(req: Request) {
  try {
    const today = new Date();
    const requester = await getRequesterOrThrow();

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const absenceTypeParam = searchParams.get("absenceType");
    const statusParam = searchParams.get("status");

    const queryStartDate = startDate ? new Date(`${startDate}T00:00:00.000Z`) : new Date(today.getFullYear(), 0, 1);
    const queryEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

    const requestedUserId = userIdParam ? Number(userIdParam) : undefined;
    if (requestedUserId && requester.role !== "Admin" && requestedUserId !== requester.id) {
      throw new AuthorizationError("Forbidden");
    }

    const absenceType =
      absenceTypeParam && isAbsenceType(absenceTypeParam) ? absenceTypeParam : undefined;
    if (statusParam && statusParam !== "ALL" && !isAbsenceStatus(statusParam)) {
      throw new ValidationError("Invalid absence status", "status");
    }
    const normalizedStatus =
      statusParam && statusParam !== "ALL" && isAbsenceStatus(statusParam) ? statusParam : undefined;

    const baseRangeFilter = {
      AND: [{ startDate: { lte: queryEndDate } }, { endDate: { gte: queryStartDate } }],
    };

    const commonFilter = {
      ...baseRangeFilter,
      type: absenceType,
    };

    let whereClause: any;

    if (requester.role === "Admin") {
      whereClause = {
        ...commonFilter,
        userId: requestedUserId,
        status: statusParam === "ALL" ? undefined : normalizedStatus ?? "APPROVED",
      };
    } else if (statusParam === "ALL" && !requestedUserId) {
      whereClause = {
        ...commonFilter,
        OR: [
          { status: "APPROVED" },
          {
            userId: requester.id,
            status: { in: ["PENDING", "REJECTED"] },
          },
        ],
      };
    } else {
      const effectiveUserId = requestedUserId ?? (normalizedStatus && normalizedStatus !== "APPROVED" ? requester.id : undefined);
      whereClause = {
        ...commonFilter,
        userId: effectiveUserId,
        status: statusParam === "ALL" ? undefined : normalizedStatus ?? "APPROVED",
      };
    }

    const absences = await db.absence.findMany({
      where: whereClause,
      include: {
        user: {
          omit: {
            password: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ startDate: "asc" }, { endDate: "asc" }],
    });

    const extendedAbsences = absences.map((absence) => {
      const overlapStart = absence.startDate > queryStartDate ? absence.startDate : queryStartDate;
      const overlapEnd = absence.endDate < queryEndDate ? absence.endDate : queryEndDate;
      return {
        ...absence,
        overlapBusinessDays:
          absence.startDate >= queryStartDate && absence.endDate <= queryEndDate
            ? absence.days
            : getBusinessDays(overlapStart, overlapEnd, []),
      };
    });

    return NextResponse.json({ absences: extendedAbsences }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const requester = await getRequesterOrThrow();
    const body = await req.json();
    const { id, startDate, endDate, type, status } = body;

    if (!id) {
      throw new ValidationError("Absence ID is required", "id");
    }

    const isReviewAction =
      typeof status === "string" &&
      (status === "APPROVED" || status === "REJECTED") &&
      !startDate &&
      !endDate &&
      !type;

    if (isReviewAction) {
      if (requester.role !== "Admin") {
        throw new AuthorizationError("Only administrators can review leave requests");
      }

      const existing = await db.absence.findUnique({
        where: { id },
        include: { user: { select: { username: true, email: true } } },
      });

      if (!existing) {
        throw new RecordNotFoundError("Absence", id);
      }

      if (status === "APPROVED") {
        const [overlappingApprovedAbsence, workHoursConflict] = await Promise.all([
          db.absence.findFirst({
            where: {
              id: { not: id },
              userId: existing.userId,
              status: "APPROVED",
              startDate: { lte: existing.endDate },
              endDate: { gte: existing.startDate },
            },
          }),
          db.workHours.findFirst({
            where: {
              userId: existing.userId,
              date: {
                gte: existing.startDate,
                lte: existing.endDate,
              },
            },
          }),
        ]);

        if (overlappingApprovedAbsence) {
          throw new AbsenceOverlapError(
            `[${overlappingApprovedAbsence.type}: ${niceDate(overlappingApprovedAbsence.startDate)} - ${niceDate(overlappingApprovedAbsence.endDate)}]`,
            `${niceDate(existing.startDate)} to ${niceDate(existing.endDate)}`
          );
        }

        if (workHoursConflict && !isBackdatedRange(existing.endDate)) {
          throw new WorkHoursConflictError(`${niceDate(existing.startDate)} to ${niceDate(existing.endDate)}`);
        }
      }

      const updatedAbsence = await db.absence.update({
        where: { id },
        data: {
          status,
          reviewedById: requester.id,
          reviewedAt: new Date(),
        },
      });

      if (status === "APPROVED") {
        await notifyUser(existing.userId, {
          title: "Leave Request Approved",
          message: NotificationMessage.AbsenceApproved(
            existing.user.username,
            formatDate(existing.startDate),
            formatDate(existing.endDate)
          ),
          type: NotificationType.SUCCESS,
          actionType: "VIEW_ABSENCE",
          senderUserId: requester.id,
          actionData: { startDate: existing.startDate.toISOString() },
        });
      } else {
        await notifyUser(existing.userId, {
          title: "Leave Request Rejected",
          message: NotificationMessage.AbsenceRejected(
            requester.username,
            existing.type,
            formatDate(existing.startDate),
            formatDate(existing.endDate)
          ),
          type: NotificationType.WARNING,
          actionType: "VIEW_ABSENCE",
          senderUserId: requester.id,
          actionData: { startDate: existing.startDate.toISOString() },
        });
      }

      try {
        if (existing.user.email) {
          const emailResult = await sendLeaveDecisionEmailToEmployee(existing.user.email, {
            employeeName: existing.user.username,
            leaveType: existing.type,
            startDate: formatDate(existing.startDate),
            endDate: formatDate(existing.endDate),
            businessDays: existing.days,
            status,
            reviewerName: requester.username,
          });

          if (!emailResult.success) {
            console.error(`Failed to send leave decision email to employee ${existing.userId}`);
          }
        } else {
          console.warn(`Skipping leave decision email. User ${existing.userId} has no email.`);
        }
      } catch (emailError) {
        // Keep review action successful even if email fails.
        console.error("Error sending leave decision email:", emailError);
      }

      return NextResponse.json(
        {
          absence: updatedAbsence,
          message: status === "APPROVED" ? "Leave request approved successfully." : "Leave request rejected.",
        },
        { status: 200 }
      );
    }

    if (requester.role !== "Admin") {
      throw new AuthorizationError("Only administrators can edit absences");
    }
    if (!startDate || !endDate || !type) {
      throw new ValidationError("Missing required fields", "startDate/endDate/type");
    }
    if (!isAbsenceType(type)) {
      throw new ValidationError("Invalid absence type", "type");
    }

    const { start, end } = parseDateRange(startDate, endDate);
    const startIso = start.toISOString().split("T")[0];
    const endIso = end.toISOString().split("T")[0];

    const currentAbsence = await db.absence.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            locationId: true,
          },
        },
      },
    });
    if (!currentAbsence) {
      throw new RecordNotFoundError("Absence", id);
    }

    const [holidays, overlappingAbsence, existingWorkHours] = await Promise.all([
      db.holidays.findMany({
        where: {
          locationId: currentAbsence.user.locationId,
          date: {
            gte: startIso,
            lte: endIso,
          },
        },
        select: { date: true },
      }),
      db.absence.findFirst({
        where: {
          id: { not: id },
          userId: currentAbsence.userId,
          status: { in: ["PENDING", "APPROVED"] },
          startDate: { lte: end },
          endDate: { gte: start },
        },
      }),
      db.workHours.findFirst({
        where: {
          userId: currentAbsence.userId,
          date: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);

    if (overlappingAbsence) {
      throw new AbsenceOverlapError(
        `[${overlappingAbsence.type}: ${niceDate(overlappingAbsence.startDate)} - ${niceDate(overlappingAbsence.endDate)}]`,
        `${niceDate(start)} to ${niceDate(end)}`
      );
    }
    if (existingWorkHours && !isBackdatedRange(end)) {
      throw new WorkHoursConflictError(`${niceDate(start)} to ${niceDate(end)}`);
    }

    const holidayDates = holidays.map((h) => h.date);
    const businessDays = getBusinessDays(start, end, holidayDates);

    const updatedAbsence = await db.absence.update({
      where: { id },
      data: {
        startDate: start,
        endDate: end,
        days: businessDays,
        type: type as any,
      },
    });

    return NextResponse.json(
      {
        absence: updatedAbsence,
        message: `Absence updated (${businessDays} business days)`,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const requester = await getRequesterOrThrow();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ValidationError("Absence ID is required", "id");
    }

    const existing = await db.absence.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!existing) {
      throw new RecordNotFoundError("Absence", id);
    }

    const canDeleteOwnPending =
      existing.userId === requester.id && existing.status === "PENDING";
    if (requester.role !== "Admin" && !canDeleteOwnPending) {
      throw new AuthorizationError("Only administrators can delete this absence");
    }

    await db.absence.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Absence deleted" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
