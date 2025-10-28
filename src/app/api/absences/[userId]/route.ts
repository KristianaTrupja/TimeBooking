import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthenticationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";


export async function GET(req: Request, { params }: { params: Promise<{ userId: string }>}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { userId } = await params;
    const userIdInt = Number(userId);
    const today = new Date();
    const currentYear = today.getFullYear();

    // Carryover is valid for the entire current year
    const isBeyondMarch = today.getMonth() >= 3; // Apr=3, May=4, etc.

    // Get vacation allotments for current and previous year
    const [currentYearRecord, prevYearRecord] = await Promise.all([
      db.totalVacationDays.findUnique({
        where: { userId_year: { userId: userIdInt, year: currentYear } },
      }),
      db.totalVacationDays.findUnique({
        where: { userId_year: { userId: userIdInt, year: currentYear - 1 } },
      }),
    ]);

    const currentYearGrantedDays = currentYearRecord?.grantedDays || 0;
    const previousYearGrantedDays = prevYearRecord?.grantedDays || 0;

    // Fetch all vacation absences
    const vacationAbsences = await db.absence.findMany({
      where: {
        userId: userIdInt,
        type: "VACATION",
      },
    });

    // Track how many vacation days were used per year
    const usedByYear = vacationAbsences.reduce((acc, absence) => {
      const year = absence.startDate.getFullYear();
      if (!acc[year]) acc[year] = 0;
      acc[year] += absence.days;
      return acc;
    }, {} as Record<number, number>);

    const usedPreviousYear = usedByYear[currentYear - 1] || 0;
    const usedCurrentYearTotal = usedByYear[currentYear] || 0;

    // Calculate carryover from previous year (valid throughout entire current year)
    const carriedOverDays = Math.max(previousYearGrantedDays - usedPreviousYear, 0);

    // Deduct current year usage: first from carryover, then from current year allocation
    let lastYearDaysSpent = 0;
    let currentYearDaysSpent = 0;

    if (usedCurrentYearTotal > 0) {
      if (usedCurrentYearTotal <= carriedOverDays) {
        // All usage came from carryover
        lastYearDaysSpent = usedCurrentYearTotal;
      } else {
        // Used all carryover + some from current year
        lastYearDaysSpent = carriedOverDays;
        currentYearDaysSpent = usedCurrentYearTotal - carriedOverDays;
      }
    }

    const lastYearDaysLeft = carriedOverDays - lastYearDaysSpent;
    const currentYearDaysLeft = currentYearGrantedDays - currentYearDaysSpent;
    const totalDaysLeft = lastYearDaysLeft + currentYearDaysLeft;

    const isOverdrawn = totalDaysLeft < 0;

    return NextResponse.json(
      {
        currentYear: {
          year: currentYear,
          daysLeft: currentYearDaysLeft,
          daysSpent: currentYearDaysSpent,
        },
        lastYear: {
          year: currentYear - 1,
          daysLeft: lastYearDaysLeft,
          daysSpent: lastYearDaysSpent,
        },
        totalDaysLeft,
        isOverdrawn,
        isBeyondMarch,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
