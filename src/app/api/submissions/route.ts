import { NotificationMessage } from "@/constants/notificationTemplates";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthenticationError, AuthorizationError, ConflictError, RecordNotFoundError, ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { notifyUser, notifyUsersByRole } from "@/lib/notificationsLib";
import { NotificationType, SubmissionStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function formatDate(date:Date) {
    return new Date(date).toLocaleString("default", {
        month: "long",
        year: "numeric",
    })
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
  
    const userId = Number(session.user.id)
    const body = await req.json();
    const { month, year } = body;

    if (!month || !year) {
      throw new ValidationError('Missing month or year', 'month/year')
    }

    // Backend calculates period boundaries - business logic stays server-side
    const periodStart = new Date(year, month -1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const submission = await db.$transaction(async (tx) => {
        let submission = await tx.timeSheetSubmission.findUnique({
            where: {
            userId_periodStart_periodEnd: {
                userId,
                periodStart,
                periodEnd,
            },
            },
        });

        if (submission && submission.status !== "DRAFT" && submission.status !== "REJECTED") {
          throw new ConflictError(`Cannot submit timesheet with status: ${submission.status}`, undefined, { field:"submission.status" })
        }

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
                    periodStart,
                    periodEnd,
                    status: "DRAFT",
                },
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
    });

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
  
    if (session.user.role !== "Admin") {
      throw new AuthorizationError("Forbidden")
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Default to current month/year if not provided
    const today = new Date();
    const month = monthParam ? parseInt(monthParam) : today.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : today.getFullYear();

    // Calculate period boundaries
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch all users
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    // Fetch all submissions for this period
    const submissions = await db.timeSheetSubmission.findMany({
      where: {
        periodStart,
        periodEnd,
      },
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

    // Create a map of userId -> submission data
    const submissionMap = new Map(
      submissions.map((sub) => [
        sub.userId,
        {
          id: sub.id,
          status: sub.status,
          submittedAt: sub.submittedAt,
          approvedAt: sub.approvedAt,
          rejectedAt: sub.rejectedAt,
          totalHours: sub.workHours.reduce((sum, wh) => sum + wh.hours, 0),
        },
      ])
    );

    // Combine user data with submission data
    const timesheetData = users.map((user) => {
      const submission = submissionMap.get(user.id);
      
      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        submission: submission || null,
        totalHours: submission?.totalHours || 0,
        status: submission?.status || null,
      };
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
  
    if (session.user.role !== "Admin") {
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


