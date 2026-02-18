import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: userIdParam } = await params;
    const userId = parseInt(userIdParam);
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Get user info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate period dates
    const periodStart = new Date(Date.UTC(year, month, 1));
    const periodEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    // Get work hours with projects
    const workHours = await db.workHours.findMany({
      where: {
        userId,
        date: {
          gte: periodStart.toISOString(),
          lte: periodEnd.toISOString(),
        },
      },
      include: {
        project: {
          select: {
            project: true,
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Get absences overlapping with the period
    const absences = await db.absence.findMany({
      where: {
        userId,
        OR: [
          {
            AND: [
              { startDate: { lte: periodEnd.toISOString() } },
              { endDate: { gte: periodStart.toISOString() } }
            ]
          }
        ]
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Calculate totals and project breakdown
    const totalWorkHours = workHours.reduce((sum, wh) => sum + wh.hours, 0);
    const totalAbsenceDays = absences.reduce((sum, absence) => sum + (absence.days || 0), 0);
    
    // Calculate hours per project
    const projectBreakdown = workHours.reduce((acc, wh) => {
      const projectName = wh.project.project;
      acc[projectName] = (acc[projectName] || 0) + wh.hours;
      return acc;
    }, {} as Record<string, number>);

    // Format data
    const exportData = {
      employee: {
        username: user.username,
        email: user.email,
      },
      period: {
        month,
        year,
      },
      workHours: workHours.map(wh => ({
        date: wh.date,
        project: wh.project.project,
        hours: wh.hours,
        note: wh.note,
      })),
      absences: absences.map(absence => ({
        startDate: absence.startDate.toISOString(),
        endDate: absence.endDate.toISOString(),
        type: absence.type,
        days: absence.days || 0,
      })),
      summary: {
        totalWorkHours,
        totalAbsenceDays,
        projectBreakdown,
      }
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Error fetching timesheet export data:", error);
    return NextResponse.json(
      { error: "Failed to fetch timesheet data" },
      { status: 500 }
    );
  }
}
