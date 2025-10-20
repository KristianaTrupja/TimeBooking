import { getBusinessDays } from "@/app/utils/dateUtils";
import { NotificationMessage } from "@/constants/notificationTemplates";
import { db } from "@/lib/db";
import { notifyUsersByRole } from "@/lib/notificationsLib";
import { AbsenceType } from "@/types/absence";
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { startDate, endDate, type, userId:employeeId } = body;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { message: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');

    if (start > end) {
      return NextResponse.json(
        { message: "Start date must be before end date" },
        { status: 400 }
      );
    }

    const [holidays, previousAbsences, employee] = await Promise.all([
      db.holidays.findMany({
        select: { date: true }
      }),
      db.absence.findMany({
        where: { 
          userId: Number(employeeId),
          startDate: { lte: end },
          endDate: { gte: start }
        }
      }),
      db.user.findFirst({
        where: { 
          id: Number(employeeId)
        }
      })
    ])

    if(!employee){
      return NextResponse.json(
        { message: `Employee with id: ${employeeId} was not found!` },
        { status: 404 }
      )
    }

    function niceDate(date:Date):string{
      return date.toLocaleDateString('en-GB', {day: 'numeric',month: 'short',year: 'numeric', timeZone: 'UTC'})
    }

    if(previousAbsences.length){
      const selectedRange = niceDate(start) + " to " + niceDate(end)
      const beautifiedAbsences = previousAbsences.map(a => `[${a.type}: ${niceDate(a.startDate)} -  ${niceDate(a.endDate)}]`).join(", ")
      return NextResponse.json(
        { message: `Selected date range "${selectedRange}" overlaps with other absences for this employee: ${beautifiedAbsences}` },
        { status: 409 }
      )
    }

    const newAbsence = await db.absence.create({
      data: {
        startDate: start,
        endDate: end,
        type,
        userId:employeeId,
      },
      include: {
          user: {
            select: { username: true },
          },
      },
    })

    await notifyUsersByRole({
      role: "Admin",
      title: "Absence Approved",
      message: NotificationMessage.AbsenceApproved(newAbsence.user.username, start.toLocaleDateString(), end.toLocaleDateString()),
      type: NotificationType.INFO,
      actionType: "VIEW_ABSENCE",
      actionUrl: `/admin?tab=modify-absences`,
    })
    const holidayDates = holidays.map(h => h.date)

    return NextResponse.json(
      { absence: newAbsence, message: `${getBusinessDays(start, end, holidayDates)} days off successfully granted to ${employee.username}.` },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating absence:", error.message || error);
    return NextResponse.json(
      { message: error.message || "Something went wrong!" },
      { status: 500 }
    );
  }
}
  

export async function GET(req: Request) {
  const today = new Date()
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const absenceType = searchParams.get("absenceType") as (AbsenceType | null)
    const queryStartDate = startDate ? new Date(startDate) : new Date(today.getFullYear(), 0, 1)
    const queryEndDate = endDate ? new Date(endDate) : new Date(today.getFullYear(), 11, 31)

    const [holidays, absences] = await Promise.all([
      db.holidays.findMany({
        select: { date: true }
      }),
      db.absence.findMany({
        where: {
          userId: userId ? Number(userId) : undefined,
          type: absenceType ? absenceType : undefined,
          AND: [
            {startDate: { lte: queryEndDate }},
            {endDate: { gte: queryStartDate }}
          ]
        },
        include: { user: true },
      })
    ])
    
    const holidayDates = holidays.map(h => h.date)

    const extendedAbsences = absences.map(absence => {
      const overlapStart = absence.startDate > queryStartDate ? absence.startDate : queryStartDate
      const overlapEnd = absence.endDate < queryEndDate ? absence.endDate : queryEndDate

      return {
        ...absence, 
        businessDays: getBusinessDays(absence.startDate, absence.endDate, holidayDates),
        overlapBusinessDays: getBusinessDays(overlapStart, overlapEnd, holidayDates)
      }
    })

    return NextResponse.json({ absences: extendedAbsences }, { status: 200 })
  } catch (error) {
    console.error("Error fetching absences:", error)
    return NextResponse.json({ message: "Failed to fetch absences" }, { status: 500 })
  }
}


export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, startDate, endDate, type } = body;

    const updatedAbsence = await db.absence.update({
      where: { id },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
      },
    });

    return NextResponse.json({ absence: updatedAbsence, message: "Absence updated" }, { status: 200 });
  } catch (error) {
    console.error("Error updating absence:", error);
    return NextResponse.json({ message: "Failed to update absence" }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
  
      if (!id) {
        return NextResponse.json({ message: "Absence ID is required" }, { status: 400 });
      }
  
      await db.absence.delete({
        where: { id },
      });
  
      return NextResponse.json({ message: "Absence deleted" }, { status: 200 });
    } catch (error) {
      console.error("Error deleting absence:", error);
      return NextResponse.json({ message: "Failed to delete absence" }, { status: 500 });
    }
}
