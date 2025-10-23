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
          throw new AuthenticationError("Unauthorized")
        }
        
        const { userId } = await params;
        const userIdInt = parseInt(userId);
        const currentYear = new Date().getFullYear();
        const grantedDaysRecord = await db.totalVacationDays.findUnique({
            where: {
                userId_year: {
                    userId: userIdInt,
                    year: currentYear
                }
            }
        });

        const currentYearGrantedVocationDays = grantedDaysRecord?.grantedDays || 0
 

        const vacationAbsences = await db.absence.findMany({
            where: {
                userId: userIdInt,
                type: "VACATION"
            }
        });

        const totalDaysUsed = vacationAbsences.reduce((sum, absence) => sum + absence.days, 0);

        const remainingDays = currentYearGrantedVocationDays - totalDaysUsed;

        const isOverdrawn = remainingDays < 0;

        return NextResponse.json({ 
            days: remainingDays,
            grantedDays: currentYearGrantedVocationDays,
            usedDays: totalDaysUsed,
            isOverdrawn
        }, { status: 200 })

    } catch (error) {
      return handleApiError(error)
    }
}
