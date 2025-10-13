import { getEndOfMonth, getStartOfMonth } from "@/app/utils/dateUtils";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUsersByRole } from "@/lib/notifications";
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
        const monthParam = searchParams.get("month")
        const yearParam = searchParams.get("year")

        if(!monthParam || !yearParam) {
            return NextResponse.json(
                { message: "Month and year are required parameters." },
                { status: 400 }
            )
        }

        const month = Number(monthParam);
        const year = Number(yearParam);

        if (
        isNaN(month) || 
        isNaN(year) || 
        month < 1 || 
        month > 12 || 
        year < 2000 || 
        year > 2100
        ) {
            return NextResponse.json(
                { message: "Invalid submission period. Month must be 1-12 and year must be a valid 4-digit year." },
                { status: 400 }
            )
        }

        const period = new Date(year, month - 1, 15)
        const periodStart = getStartOfMonth(period)
        const periodEnd = getEndOfMonth(period)

        const result = await db.$transaction(async (tx) => {
            const submission = await tx.timeSheetSubmission.create({
                data: {
                    userId,
                    periodStart,
                    periodEnd,
                    status: 'PENDING',
                    submittedAt: new Date()
                }
            })

            const updatedHours = await tx.workHours.updateMany({
                where: {
                    userId,
                    date: { gte: periodStart, lte: periodEnd },
                    status: 'UNSUBMITTED'
                },
                data: {
                    submissionId: submission.id,
                    status: 'SUBMITTED',
                    isLocked: true
                }
            });

            if (updatedHours.count === 0) {
                throw new Error('No unsubmitted work hours found for this period');
            }

            return { submission, count: updatedHours.count }

        }, {
            maxWait: 5000,
            timeout: 10000,
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
        })

        await notifyUsersByRole({
            role: "Admin",
            title: "TimeSheet Aproval Request",
            message: `${session.user.username} submitted working hours for ${formatDate(new Date(period))}`,
            type: NotificationType.APPROVAL_REQUEST,
            actionType: "VIEW_TIMESHEET",
            actionUrl: `/admin?tab=timesheets`,
        })

        return NextResponse.json(
            { message:`TimeSheet for ${formatDate(new Date(period))} was submitted successfully!`, submission: result.submission },
            { status: 201 }
        )
    } catch (error: any) {
        console.error("Error creating submission:", error);
        return NextResponse.json(
            { message: error.message || "Something went wrong!" },
            { status: 500 }
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
  try {
    const body = await req.json();
    const { id, startDate, endDate, type } = body;

    return NextResponse.json({  }, { status: 200 });
  } catch (error) {
    console.error("Error updating absence:", error);
    return NextResponse.json({ message: "Failed to update absence" }, { status: 500 });
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


