import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust path as needed
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

    // Allow carryover only during Jan–Mar
    const isCarryoverPeriod = today.getMonth() < 3; // Jan=0, Feb=1, Mar=2

    // Get vacation allotments for current and previous year
    const [currentYearRecord, prevYearRecord] = await Promise.all([
      db.totalVacationDays.findUnique({
        where: { userId_year: { userId: userIdInt, year: currentYear } },
      }),
      isCarryoverPeriod
        ? db.totalVacationDays.findUnique({
            where: { userId_year: { userId: userIdInt, year: currentYear - 1 } },
          })
        : Promise.resolve(null),
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

    const usedCurrentYear = usedByYear[currentYear] || 0;
    const usedPreviousYear = usedByYear[currentYear - 1] || 0;

    // Calculate carryover: unused previous year's vacation days (if still within Jan–Mar)
    const leftDaysLastYear = isCarryoverPeriod ? Math.max(previousYearGrantedDays - usedPreviousYear, 0) : 0;
    const leftDaysCurrentYear = currentYearGrantedDays - usedCurrentYear
    const leftDaysTotal = leftDaysCurrentYear + leftDaysLastYear;

    const isOverdrawn = leftDaysTotal < 0;

    return NextResponse.json(
      {
        leftDaysTotal,
        leftDaysCurrentYear,
        leftDaysLastYear,
        usedDaysCurrentYear: usedCurrentYear,
        isOverdrawn,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
