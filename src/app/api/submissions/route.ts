import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);

  try {
    const body = await req.json();
    const { month, year } = body;

    // Validate required fields
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Missing month or year' },
        { status: 400 }
      );
    }

    // Backend calculates period boundaries - business logic stays server-side
    const periodStart = new Date(year, month -1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const submission = await db.$transaction(async (tx) => {

        // Finding or verifying the submission for this period
        let submission = await tx.timeSheetSubmission.findUnique({
            where: {
            userId_periodStart_periodEnd: {
                userId,
                periodStart,
                periodEnd,
            },
            },
        });

        // Validating submission status if it exists
        if (submission && submission.status !== "DRAFT" && submission.status !== "REJECTED") {
            throw new Error(`Cannot submit timesheet with status: ${submission.status}`);
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
            throw new Error("No work hours found for this period");
        }

        // Creating submission if it doesn't exist (shouldn't happen with creation flow, but safety)
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
      title: "TimeSheet Approval Request",
      message: `${session.user.username} submitted working hours for ${formatDate(
        new Date(submission.periodEnd)
      )}`,
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
    console.error("Error submitting timesheet:", error);
    return NextResponse.json(
      { error: error.message || "Could not submit timesheet" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
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
    console.error("Error fetching admin timesheets:", error);
    return NextResponse.json(
      { message: "Failed to fetch timesheets" },
      { status: 500 }
    );
  }
}


export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const submissionIdParam = searchParams.get("submissionId")
    const submissionId = Number(submissionIdParam)
    const body = await req.json()
    const { status, rejectionReason } = body

    const isNotSubmissionStatus =  !Object.values(SubmissionStatus).includes(status)
    if (!status || isNotSubmissionStatus || !submissionId) {
        return NextResponse.json({ error: "Invalid or missing submissionId/status" }, { status: 400 });
    }

    const currentSubmission = await db.timeSheetSubmission.findUnique({
        where: { id: submissionId },
        select: { status: true, userId: true },
    });

    if (!currentSubmission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (currentSubmission.status === "DRAFT") {
        return NextResponse.json({ error: "Admins cannot modify DRAFT timesheets" }, { status: 400 });
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
      title: "TimeSheet Approval Request",
      message: `Admin ${session.user.username} ${updatedSubmission.status} the ${formatDate(new Date(updatedSubmission.periodEnd))} timesheet of ${updatedSubmission.user.username}`,
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
        message: `Timesheet ${status.toLowerCase()} successfully`,
        submission: updatedSubmission,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating submission status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

  
      return NextResponse.json({ message: "Absence deleted" }, { status: 200 });
    } catch (error) {
      console.error("Error deleting absence:", error);
      return NextResponse.json({ message: "Failed to delete absence" }, { status: 500 });
    }
}


