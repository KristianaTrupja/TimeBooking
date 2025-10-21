import { getBusinessDays } from "@/app/utils/dateUtils";
import { NotificationMessage } from "@/constants/notificationTemplates";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AbsenceOverlapError, AuthenticationError, InvalidDateRangeError, RecordNotFoundError, ValidationError, WorkHoursConflictError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { notifyUser, notifyUsersByRole } from "@/lib/notificationsLib";
import { AbsenceType } from "@/types/absence";
import { NotificationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError("Unauthorized")
  }

  try {
    const body = await req.json();
    const { startDate, endDate, type, userId:employeeId } = body;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new ValidationError("Invalid date format. Expected YYYY-MM-DD", 'startDate/endDate')
    }

    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');

    if (start > end) {
      throw new InvalidDateRangeError()
    }

    const [holidays, previousAbsences, employee, existingWorkHours] = await Promise.all([
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
      }),
      db.workHours.findFirst({
        where: {
          userId: Number(employeeId),
          date: {
            gte: start,
            lte: end
          }
        },
        select: {
          id: true,
          date: true
        }
      })
    ])

    if(!employee){
      throw new RecordNotFoundError("Employee", employeeId)
    }

    function niceDate(date:Date):string{
      return date.toLocaleDateString('en-GB', {day: 'numeric',month: 'short',year: 'numeric', timeZone: 'UTC'})
    }

    if(existingWorkHours){
      const selectedRange = niceDate(start) + " to " + niceDate(end)
      throw new WorkHoursConflictError(selectedRange)
    }

    if(previousAbsences.length){
      const selectedRange = niceDate(start) + " to " + niceDate(end)
      const existingAbsences = previousAbsences.map(a => `[${a.type}: ${niceDate(a.startDate)} -  ${niceDate(a.endDate)}]`).join(", ")
      throw new AbsenceOverlapError(existingAbsences, selectedRange)
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

    const formatDate = (date: Date) => {
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
    // Here I am sending Notifications to both Admins and Employee
    await notifyUsersByRole({
      role: "Admin",
      title: "Absence Approved",
      message: NotificationMessage.AbsenceApproved(newAbsence.user.username, formatDate(start), formatDate(end)),
      type: NotificationType.INFO,
      actionType: "VIEW_ABSENCE",
    })
    await notifyUser(employeeId, {
      title: "Absence Approved",
      message: NotificationMessage.AbsenceApproved(newAbsence.user.username, formatDate(start), formatDate(end)),
      type: NotificationType.INFO,
      actionType: "VIEW_ABSENCE",
    })
    const holidayDates = holidays.map(h => h.date)

    return NextResponse.json(
      { absence: newAbsence, message: `${getBusinessDays(start, end, holidayDates)} days off successfully granted to ${employee.username}.` },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
  

export async function GET(req: Request) {
  const today = new Date()
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError("Unauthorized")
  }

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
    return handleApiError(error)
  }
}


export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }

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
    return handleApiError(error)
  }
}


export async function DELETE(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
  
      if (!id) {
        throw new ValidationError("Absence ID is required", 'id')
      }
  
      await db.absence.delete({
        where: { id },
      });
  
      return NextResponse.json({ message: "Absence deleted" }, { status: 200 });
    } catch (error) {
      return handleApiError(error)
    }
}
