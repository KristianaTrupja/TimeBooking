import { NotificationMessage } from "@/constants/notificationTemplates";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthenticationError, AuthorizationError, ConflictError, RecordNotFoundError, ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { notifyUser, notifyUsersByRole } from "@/lib/notificationsLib";
import { sendTimesheetConfirmationEmail } from "@/lib/email";
import { NotificationType, SubmissionStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function formatDate(date:Date) {
    return new Date(date).toLocaleString("default", {
        month: "long",
        year: "numeric",
    })
}

function getPeriodBoundsUTC(year: number, month: number) {
  // Use UTC boundaries to avoid server timezone differences.
  const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { periodStart, periodEnd };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
  
    const userId = Number(session.user.id)
    const body = await req.json();
    const { month, year, employeeId } = body;

    if (!month || !year) {
      throw new ValidationError('Missing month or year', 'month/year')
    }

    if(employeeId != session?.user?.id){
      throw new AuthorizationError("FORBIDDEN: You are not authorized to submit this timesheet!")
    }

    // Backend calculates period boundaries - business logic stays server-side
    const { periodStart, periodEnd } = getPeriodBoundsUTC(year, month);
    const { periodYear, periodMonth } = { periodYear: year, periodMonth: month };

    const submission = await db.$transaction(async (tx) => {
        // IMPORTANT:
        // - There can be legacy submissions created with timezone-shifted periodStart/periodEnd.
        // - There can even be multiple submissions for the same user+month.
        // So we match by (userId + month window) using periodEnd, not exact DateTime equality.

        // If there is already a non-draft submission for this month, don't allow re-submit.
        if (submission && submission.status !== "DRAFT" && submission.status !== "REJECTED") {
          throw new ConflictError(
            `Cannot submit timesheet with status: ${submission.status}`,
            undefined,
            { field: "submission.status" }
          );
        }

        // Step 1 compatible: there can be duplicates, so pick latest by updatedAt
        let submission = await tx.timeSheetSubmission.findFirst({
          where: { userId, periodYear, periodMonth },
          orderBy: { updatedAt: "desc" },
        });

        const submittableWorkHours = await tx.workHours.findMany({
            where: {
            userId,
            date: {
                gte: periodStart,
                lte: periodEnd,
            },
            OR: [
                { submissionId: null },
                { submissionId: submission?.id },
            ],
            },
            include: {
                project: true,
            },
        })

        if (submittableWorkHours.length === 0) {
          throw new RecordNotFoundError("Working hours")
        }

        if (!submission) {
          submission = await tx.timeSheetSubmission.create({
            data: {
              userId,
              periodYear,
              periodMonth,
              periodStart,
              periodEnd,
              status: "DRAFT",
            },
          });
        } else {
          // Keep boundaries canonical
          submission = await tx.timeSheetSubmission.update({
            where: { id: submission.id },
            data: { periodYear, periodMonth, periodStart, periodEnd },
          });
        }

        // Linking any unlinked hours to the submission (handles legacy null cases)
        const unlinkedIds = submittableWorkHours
            .filter(wh => wh.submissionId === null)
            .map(wh => wh.id);

        if (unlinkedIds.length > 0) {
            await tx.workHours.updateMany({
            where: {
                id: { in: unlinkedIds },
            },
            data: {
                submissionId: submission.id,
            },
            });
        }

        // Updating submission status to PENDING
        const updatedSubmission = await tx.timeSheetSubmission.update({
            where: { id: submission.id },
            data: {
            status: "PENDING",
            submittedAt: new Date(),
            },
            include: {
            workHours: {
                include: {
                    project: true,
                },
            },
            user: {
                select: { id: true, username: true, email: true },
            },
            },
        });

        return updatedSubmission;
    })

    // Sending notification to admins
    await notifyUsersByRole({
      role: "Admin",
      title: "Timesheet Approval Request",
      message: NotificationMessage.TimesheetSubmitted(session.user.username, formatDate(new Date(submission.periodEnd))),
      type: NotificationType.APPROVAL_REQUEST,
      actionType: "VIEW_TIMESHEET",
      senderUserId: userId,
      actionMonth: month,
      actionYear: year,
    });

    // Send email notifications to all admin users
    try {
      const adminUsers = await db.user.findMany({
        where: {
          role: "Admin",
        },
        select: {
          email: true,
        },
      });

      // Filter out null/empty emails and extract email addresses
      const adminEmails = adminUsers
        .map((user) => user.email)
        .filter((email): email is string => email !== null && email !== undefined && email.trim() !== "");

      if (adminEmails.length > 0) {
        const monthString = formatDate(new Date(submission.periodEnd));
        const emailResult = await sendTimesheetConfirmationEmail(
          adminEmails,
          session.user.username || "Developer",
          monthString
        );

        if (emailResult.success) {
          console.log(`Successfully sent ${emailResult.sent} email(s) to admin users`);
        } else {
          console.error(`Failed to send emails to admin users. Failed: ${emailResult.failed}`);
        }
      } else {
        console.warn("No admin emails found to send timesheet confirmation notification");
      }
    } catch (emailError) {
      // Don't fail the submission if email sending fails
      console.error("Error sending email notifications:", emailError);
    }

    return NextResponse.json(
      {
        message: "Timesheet submitted successfully",
        submission,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
  
    // Don't trust JWT role (can be stale). Validate from DB.
    const requester = await db.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true, isActive: true },
    });

    if (!requester?.isActive || requester.role !== "Admin") {
      throw new AuthorizationError("Forbidden")
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Default to current month/year if not provided
    const today = new Date();
    const month = monthParam ? parseInt(monthParam) : today.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : today.getFullYear();

    // Calculate period boundaries (using same logic as workhours API)
    const { periodStart, periodEnd } = getPeriodBoundsUTC(year, month);

    // Fetch all users (including inactive for historical data)
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    // Fetch all submissions for this period
    const submissions = await db.timeSheetSubmission.findMany({
      where: {
        // Match by periodEnd window to handle legacy timezone-shifted records
        periodEnd: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        workHours: {
          select: {
            hours: true,
          },
        },
      },
    });

    // Link any unlinked work hours to their submissions (cleanup legacy data)
    const unlinkedWorkHours = await db.workHours.findMany({
      where: {
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
        submissionId: null,
      },
      select: {
        id: true,
        userId: true,
        date: true,
      },
    });

    // Link unlinked work hours to their corresponding submissions
    if (unlinkedWorkHours.length > 0) {
      // If there are multiple submissions per user, prefer the latest one (submissions is ordered).
      const submissionMap = new Map<number, number>();
      for (const sub of submissions) {
        if (!submissionMap.has(sub.userId)) submissionMap.set(sub.userId, sub.id);
      }

      for (const wh of unlinkedWorkHours) {
        const submissionId = submissionMap.get(wh.userId);
        if (submissionId) {
          await db.workHours.update({
            where: { id: wh.id },
            data: { submissionId },
          });
        } else {
          // Create submission for unlinked work hours
          const submission = await db.timeSheetSubmission.create({
            data: {
              userId: wh.userId,
              periodStart,
              periodEnd,
              status: "DRAFT",
            },
          });
          await db.workHours.update({
            where: { id: wh.id },
            data: { submissionId: submission.id },
          });
        }
      }

      // Refetch submissions after linking
      const updatedSubmissions = await db.timeSheetSubmission.findMany({
        where: {
          periodEnd: { gte: periodStart, lte: periodEnd },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          workHours: {
            select: {
              hours: true,
            },
          },
        },
      });
      submissions.length = 0;
      submissions.push(...updatedSubmissions);
    }

    // Fetch ALL work hours for the period to ensure we have accurate totals
    // This ensures we include work hours that were just updated/linked
    const allWorkHoursInPeriod = await db.workHours.findMany({
      where: {
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        userId: true,
        hours: true,
        submissionId: true,
      },
    });

    // Calculate total hours per user from ALL work hours in the period
    const hoursByUser = new Map<number, number>();
    allWorkHoursInPeriod.forEach((wh) => {
      const current = hoursByUser.get(wh.userId) || 0;
      hoursByUser.set(wh.userId, current + wh.hours);
    });

    // Create a map of userId -> submission data
    // If there are multiple submissions per user, prefer the latest one (submissions is ordered).
    const submissionMap = new Map<number, {
      id: number;
      status: any;
      submittedAt: Date | null;
      approvedAt: Date | null;
      rejectedAt: Date | null;
    }>();
    for (const sub of submissions) {
      if (submissionMap.has(sub.userId)) continue;
      submissionMap.set(sub.userId, {
        id: sub.id,
        status: sub.status,
        submittedAt: sub.submittedAt,
        approvedAt: sub.approvedAt,
        rejectedAt: sub.rejectedAt,
      });
    }

    // Combine user data with submission data and total hours from ALL work hours
    const timesheetData = users
      .map((user) => {
        const submission = submissionMap.get(user.id);
        const totalHours = hoursByUser.get(user.id) || 0;
        
        return {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          deletedAt: user.deletedAt,
          submission: submission || null, 
          totalHours,
          status: submission?.status || null,
        };
      })
      .filter((timesheet) => {
        // If user is active, always include
        if (timesheet.isActive) {
          return true;
        }
        
        // If user is inactive (deleted)
        if (!timesheet.isActive && timesheet.deletedAt) {
          const deletedDate = new Date(timesheet.deletedAt);
          // Include user only if the period START is before or in the same month as deletion
          // AND they have work hours in this period
          if (periodStart <= deletedDate && timesheet.totalHours > 0) {
            return true;
          }
          return false;
        }
        
        return true;
      });
    return NextResponse.json(
      {
        timesheets: timesheetData,
        period: {
          month,
          year,
          periodStart,
          periodEnd,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
  
    // Don't trust JWT role (can be stale). Validate from DB.
    const requester = await db.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { role: true, isActive: true },
    });

    if (!requester?.isActive || requester.role !== "Admin") {
      throw new AuthorizationError("Forbidden")
    }

    const { searchParams } = new URL(req.url);
    const submissionIdParam = searchParams.get("submissionId")
    const submissionId = Number(submissionIdParam)
    const body = await req.json()
    const { status, rejectionReason } = body

    const isNotSubmissionStatus =  !Object.values(SubmissionStatus).includes(status)
    if (!status || isNotSubmissionStatus || !submissionId) {
      throw new ValidationError("Invalid or missing submissionId/status", 'submissionId/status')
    }

    const currentSubmission = await db.timeSheetSubmission.findUnique({
        where: { id: submissionId },
        select: { status: true, userId: true },
    });

    if (!currentSubmission) {
      throw new RecordNotFoundError('Submission')
    }
    if (currentSubmission.status === "DRAFT") {
      throw new AuthorizationError("DRAFT timesheets status cannot be modified!")
    }

    const updateData: any = {
      status,
      approverId: parseInt(session.user.id),
    };

    // Timestamps based on status
    if (status === "APPROVED") {
      updateData.approvedAt = new Date();
    } else if (status === "REJECTED") {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason || null;
    } else if (status === "PENDING") {
        // better to store only the timestamp the employee submits and not what admin submits
        // updateData.submittedAt = new Date();
    }

    const updatedSubmission = await db.timeSheetSubmission.update({
      where: { id: submissionId },
      data: updateData,
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });
    // Notify user of status change
    await notifyUsersByRole({
      role: "Admin",
      title: "Timesheet Approval Request",
      message: NotificationMessage.TimesheetStatusChange(session.user.username, updatedSubmission.user.username, formatDate(new Date(updatedSubmission.periodEnd)), status),
      type: NotificationType.APPROVAL_REQUEST,
      actionType: "VIEW_TIMESHEET",
    });

    await notifyUser(updatedSubmission.user.id, {
        title: `Timesheet ${updatedSubmission.status}`,
        message: `${session.user.username} ${updatedSubmission.status} your ${formatDate(new Date(updatedSubmission.periodEnd))} timesheet.`,
        type: NotificationType.INFO,
    })

    return NextResponse.json(
      {
        message: `Timesheet status changed to '${status}' successfully`,
        submission: updatedSubmission,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

  
      return NextResponse.json({ message: "Absence deleted" }, { status: 200 });
    } catch (error) {
      return handleApiError(error)
    }
}


