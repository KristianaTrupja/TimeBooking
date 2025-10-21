import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust path as needed
import { db } from "@/lib/db";
import { AuthenticationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }>}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
    
    const { userId } = await params;
    const userIdInt = parseInt(userId);
    const currentYear = new Date().getFullYear();
    
    try {
        const grantedDaysRecord = await db.totalVacationDays.findUnique({
            where: {
                userId_year: {
                    userId: userIdInt,
                    year: currentYear
                }
            }
        });

        if (!grantedDaysRecord) {
            return NextResponse.json({ days: 0 }, { status: 200 });
        }

        const vacationAbsences = await db.absence.findMany({
            where: {
                userId: userIdInt,
                type: "VACATION"
            }
        });

        let totalDaysUsed = 0;
        for (const absence of vacationAbsences) {
            const startDate = new Date(absence.startDate);
            const endDate = new Date(absence.endDate);
            
            const utcStart = Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
            );
            const utcEnd = Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate()
            );
            
            const diffInDays = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
            
            totalDaysUsed += diffInDays;
        }

        const remainingDays = grantedDaysRecord.grantedDays - totalDaysUsed;

        return NextResponse.json({ days: remainingDays }, { status: 200 });
    } catch (error) {
      handleApiError(error)
    }
}
