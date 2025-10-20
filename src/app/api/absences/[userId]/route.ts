import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust path as needed
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }>}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = await params;
    const userIdInt = parseInt(userId);
    const currentYear = new Date().getFullYear();
    
    try {
        // Get granted vacation days for the current year
        const grantedDaysRecord = await db.totalVocationDays.findUnique({
            where: {
                userId_year: {
                    userId: userIdInt,
                    year: currentYear
                }
            }
        });

        // If no granted days record exists, return 0
        if (!grantedDaysRecord) {
            return NextResponse.json({ days: 0 }, { status: 200 });
        }

        // Query all VACATION absences for the user
        const vacationAbsences = await db.absence.findMany({
            where: {
                userId: userIdInt,
                type: "VACATION" // Note: It's VACATION, not VOCATION in your enum
            }
        });

        // Calculate total days used
        let totalDaysUsed = 0;
        for (const absence of vacationAbsences) {
            const startDate = new Date(absence.startDate);
            const endDate = new Date(absence.endDate);
            
            // Calculate difference in milliseconds
            const diffInMs = endDate.getTime() - startDate.getTime();
            
            // Convert to days (add 1 to include both start and end dates)
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
            
            totalDaysUsed += diffInDays;
        }

        // Calculate remaining days
        const remainingDays = Math.max(0, grantedDaysRecord.grantedDays - totalDaysUsed);

        return NextResponse.json({ days: remainingDays }, { status: 200 });
    } catch (error) {
        console.error("Error fetching absences:", error);
        return NextResponse.json({ message: "Failed to fetch absences" }, { status: 500 });
    }
}
