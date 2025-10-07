import { getBusinessDays } from "@/app/utils/dateUtils";
import { db } from "@/lib/db";
import { AbsenceType } from "@/types/absence";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
      const body = await req.json();
      const { startDate, endDate, type, userId } = body;
  
      // Convert to Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);
  
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { message: "Invalid date format" },
          { status: 400 }
        );
      }
  
      if (start > end) {
        return NextResponse.json(
          { message: "Start date must be before end date" },
          { status: 400 }
        );
      }
  
      const newAbsence = await db.absence.create({
        data: {
          startDate: start,
          endDate: end,
          type,
          userId,
        },
      });
  
      return NextResponse.json(
        { absence: newAbsence, message: "Absence created successfully" },
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
    console.log(holidayDates)

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


