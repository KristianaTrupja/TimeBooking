import { getEndOfMonth, getStartOfMonth } from "@/app/utils/dateUtils";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUsersByRole } from "@/lib/notificationsLib";
import { AbsenceType } from "@/types/absence";
import { NotificationType, Prisma } from "@prisma/client";
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

    const userId = Number(session.user.id)
  try {
    const { searchParams } = new URL(req.url)
    const result = searchParams.get("submissionId")
    const submissionId = Number(result);

    if (isNaN(submissionId)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    const submission = await db.$transaction(async (tx) => {
      const submission = await tx.timeSheetSubmission.findUnique({
        where: { id: submissionId, userId },
        include: {
          workHours: true,
          user: {
            select: { id: true, username: true, email: true }
          }
        },
      });

      if (!submission) {
        throw new Error("Timesheet submission not found");
      }

      // Only DRAFT/REJECTED timesheets can be submitted
      if (submission.status !== "DRAFT" && submission.status !== "REJECTED") {
        throw new Error(`Cannot submit timesheet with status: ${submission.status}`);
      }

      // Validate that there are work hours to submit
      if (submission.workHours.length === 0) {
        throw new Error("Cannot submit empty timesheet");
      }

      // Update submission status to PENDING
      const updatedSubmission = await tx.timeSheetSubmission.update({
        where: { id: submissionId, userId },
        data: {
          status: "PENDING",
          submittedAt: new Date(),
        },
        include: {
          workHours: {
            include: {
              project: true
            }
          }
        }
      });

      return updatedSubmission;
    })

    await notifyUsersByRole({
        role: "Admin",
        title: "TimeSheet Aproval Request",
        message: `${session.user.username} submitted working hours for ${formatDate(new Date(submission.periodEnd))}`,
        type: NotificationType.APPROVAL_REQUEST,
        actionType: "VIEW_TIMESHEET"
    })

    return NextResponse.json(
      { 
        message: "Timesheet submitted successfully",
        submission 
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

    const userId = Number(session.user.id)

  const today = new Date()
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const absenceType = searchParams.get("absenceType") as (AbsenceType | null)
    const queryStartDate = startDate ? new Date(startDate) : new Date(today.getFullYear(), 0, 1)
    const queryEndDate = endDate ? new Date(endDate) : new Date(today.getFullYear(), 11, 31)


    return NextResponse.json({  }, { status: 200 })
  } catch (error) {
    console.error("Error fetching absences:", error)
    return NextResponse.json({ message: "Failed to fetch absences" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id)
  try {
    const { searchParams } = new URL(req.url)
    const result = searchParams.get("submissionId")


    return NextResponse.json(
      {},
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


