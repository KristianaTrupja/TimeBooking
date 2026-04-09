import { authOptions } from "@/lib/auth";
import { NotificationMessage } from "@/constants/notificationTemplates";
import { db } from "@/lib/db";
import {
  AuthenticationError,
  AuthorizationError,
  RecordNotFoundError,
  ValidationError,
} from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { notifyUser, notifyUsersByRole } from "@/lib/notificationsLib";
import { NotificationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type LeaveAdjustmentTypeValue = "OVERTIME_COMPENSATION" | "UNUSED_LEAVE_CASHOUT";

const LEAVE_ADJUSTMENT_TYPES: LeaveAdjustmentTypeValue[] = [
  "OVERTIME_COMPENSATION",
  "UNUSED_LEAVE_CASHOUT",
];

function isLeaveAdjustmentType(value: string): value is LeaveAdjustmentTypeValue {
  return LEAVE_ADJUSTMENT_TYPES.includes(value as LeaveAdjustmentTypeValue);
}

function formatAdjustmentType(value: LeaveAdjustmentTypeValue): string {
  return value === "OVERTIME_COMPENSATION" ? "Overtime compensation" : "Unused leave cashout";
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

export async function GET(req: Request) {
  try {
    const requester = await getRequesterOrThrow();
    const { searchParams } = new URL(req.url);

    const userIdParam = searchParams.get("userId");
    const yearParam = searchParams.get("year");

    const targetUserId = userIdParam ? Number(userIdParam) : requester.id;
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      throw new ValidationError("Invalid user id", "userId");
    }

    if (requester.role !== "Admin" && targetUserId !== requester.id) {
      throw new AuthorizationError("Forbidden");
    }

    let parsedYear: number | undefined;
    if (yearParam) {
      const candidateYear = Number(yearParam);
      if (!Number.isInteger(candidateYear) || candidateYear < 2000 || candidateYear > 3000) {
        throw new ValidationError("Invalid year", "year");
      }
      parsedYear = candidateYear;
    }

    const adjustments = await db.leaveAdjustment.findMany({
      where: {
        userId: targetUserId,
        year: parsedYear,
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ adjustments }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const requester = await getRequesterOrThrow();
    if (requester.role !== "Admin") {
      throw new AuthorizationError("Only administrators can create leave adjustments");
    }

    const body = await req.json();
    const { userId, year, type, days, note } = body;

    const targetUserId = Number(userId);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      throw new ValidationError("Invalid user id", "userId");
    }

    const targetYear = Number(year);
    if (!Number.isInteger(targetYear) || targetYear < 2000 || targetYear > 3000) {
      throw new ValidationError("Invalid year", "year");
    }

    if (typeof type !== "string" || !isLeaveAdjustmentType(type)) {
      throw new ValidationError("Invalid leave adjustment type", "type");
    }

    const parsedDays = Number(days);
    if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
      throw new ValidationError("Days must be a positive integer", "days");
    }

    if (note !== undefined && note !== null && typeof note !== "string") {
      throw new ValidationError("Note must be a string", "note");
    }

    const employee = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isActive: true, username: true },
    });
    if (!employee?.isActive) {
      throw new RecordNotFoundError("Employee", targetUserId);
    }

    if (type === "UNUSED_LEAVE_CASHOUT") {
      const [yearVacation, approvedVacationsInYear, sameYearAdjustments] = await Promise.all([
        db.totalVacationDays.findUnique({
          where: { userId_year: { userId: targetUserId, year: targetYear } },
          select: { grantedDays: true },
        }),
        db.absence.findMany({
          where: {
            userId: targetUserId,
            type: "VACATION",
            status: "APPROVED",
            startDate: {
              gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
              lte: new Date(`${targetYear}-12-31T23:59:59.999Z`),
            },
          },
          select: { days: true },
        }),
        db.leaveAdjustment.findMany({
          where: { userId: targetUserId, year: targetYear },
          select: { type: true, days: true },
        }),
      ]);

      const grantedDays = yearVacation?.grantedDays ?? 0;
      const usedDays = approvedVacationsInYear.reduce((sum, item) => sum + item.days, 0);
      const overtimeDays = sameYearAdjustments
        .filter((item) => item.type === "OVERTIME_COMPENSATION")
        .reduce((sum, item) => sum + item.days, 0);
      const alreadyCashedOutDays = sameYearAdjustments
        .filter((item) => item.type === "UNUSED_LEAVE_CASHOUT")
        .reduce((sum, item) => sum + item.days, 0);

      const availableToCashout = grantedDays + overtimeDays - alreadyCashedOutDays - usedDays;
      if (parsedDays > availableToCashout) {
        throw new ValidationError(
          `Cannot cash out ${parsedDays} day(s). Only ${Math.max(availableToCashout, 0)} day(s) available for ${targetYear}.`,
          "days"
        );
      }
    }

    const adjustment = await db.leaveAdjustment.create({
      data: {
        userId: targetUserId,
        year: targetYear,
        type,
        days: parsedDays,
        note: typeof note === "string" ? note.trim() || null : null,
      },
    });

    const adjustmentTypeLabel = formatAdjustmentType(type);
    await notifyUsersByRole({
      role: "Admin",
      title: "Leave Adjustment Recorded",
      message: NotificationMessage.LeaveAdjustmentAdmin(
        requester.username,
        employee.username,
        adjustmentTypeLabel,
        parsedDays,
        targetYear
      ),
      type: NotificationType.INFO,
      actionType: "VIEW_ABSENCE",
      senderUserId: requester.id,
      actionData: {
        userId: targetUserId,
        year: targetYear,
        type,
        days: parsedDays,
      },
    });

    await notifyUser(targetUserId, {
      title: "Leave Balance Updated",
      message: NotificationMessage.LeaveAdjustmentEmployee(
        requester.username,
        adjustmentTypeLabel,
        parsedDays,
        targetYear
      ),
      type: NotificationType.INFO,
      actionType: "VIEW_ABSENCE",
      senderUserId: requester.id,
      actionData: {
        year: targetYear,
        type,
        days: parsedDays,
      },
    });

    return NextResponse.json(
      { adjustment, message: "Leave adjustment recorded successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
