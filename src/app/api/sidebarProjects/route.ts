import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/handlers";
import { AuthenticationError, AuthorizationError, RecordNotFoundError, TimesheetLockedError, ValidationError } from "@/lib/errors/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || "");
    const month = parseInt(searchParams.get("month") || "");
    const userId = parseInt(searchParams.get("userId") || "");
  
    if (isNaN(month) || isNaN(year) || isNaN(userId)) {
      throw new ValidationError("Month, year, and userId are required")
    }
  
    const rawProjects = await db.sidebarProject.findMany({
      where: { userId, year, month },
      select: { 
        companyId: true,
        title: true, 
        projectKey: true,
        company: {
          select: {
            name: true,
            isActive: true
          }
        }
      },
    });
  
    // Extract project IDs from projectKeys (format: PID-{id})
    const projectIds = rawProjects
      .map(p => {
        const match = p.projectKey.match(/PID-(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((id): id is number => id !== null);
  
    // Fetch isActive status for all projects
    const projectsStatus = await db.projects.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, isActive: true },
    });
  
    const projectStatusMap = new Map(projectsStatus.map(p => [p.id, p.isActive]));
  
    const groupedProjects = rawProjects.reduce((acc, proj) => {
      const companyName = proj.company.name;
      if (!acc[companyName]) acc[companyName] = { companyId: proj.companyId, projects: [] };
      
      // Extract project ID and get isActive status
      const match = proj.projectKey.match(/PID-(\d+)/);
      const projectId = match ? parseInt(match[1]) : null;
      const isActive = projectId !== null ? projectStatusMap.get(projectId) ?? true : true;
      
      acc[companyName].projects.push({ 
        title: proj.title, 
        projectKey: proj.projectKey,
        isActive 
      });
      return acc;
    }, {} as Record<string, { companyId: number; projects: { title: string; projectKey: string; isActive: boolean }[] }>);
  
    const response = Object.entries(groupedProjects).map(([company, { companyId, projects }]) => ({
      company,
      companyId,
      projects,
    }));
  
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }
  
    const body = await req.json();
    const { year, month, projects, userId } = body;
    const loggedInUserId = Number(session.user.id);

    console.log("year and month are required!", year, month, projects, userId);

    if (!year || isNaN(month) || !Array.isArray(projects)) {
      throw new ValidationError("year and month are required!");
    }

    if (loggedInUserId !== Number(userId)) {
      throw new AuthorizationError("Forbidden: You cannot modify this project")
    }

    const projectsToCreate = projects.flatMap((group) =>
      group.projects.map((project:any) => ({
        userId: loggedInUserId,
        companyId: group.companyId,
        title: project.title,
        projectKey: project.projectKey,
        year,
        month,
      }))
    );

    await db.$transaction([
      db.sidebarProject.deleteMany({
        where: { userId:loggedInUserId, year, month },
      }),
      db.sidebarProject.createMany({
        data: projectsToCreate,
        skipDuplicates: true,
      }),
    ]);

    return NextResponse.json({ message: "Saved" });
    
  } catch (error) {
    return handleApiError(error);
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
    
    const userId = session.user.id;
    const body = await req.json();
    const { projectKey, year, month, force } = body;

    if (!projectKey || !year || !month) {
      throw new ValidationError("projectKey, year, and month are required", "projectKey/year/month")
    }

    // Force delete removes both the sidebar project and all workhours for that project
    // in the given month/year for the logged-in user.
    if (force === true) {
      const projectIdMatch = String(projectKey).match(/PID-(\d+)/);
      const projectId = projectIdMatch ? Number(projectIdMatch[1]) : NaN;
      if (!Number.isFinite(projectId)) {
        throw new ValidationError("Invalid projectKey format", "projectKey");
      }

      const monthIndex = Number(month); // SidebarProject months are stored as 0-indexed
      const y = Number(year);
      if (!Number.isFinite(monthIndex) || !Number.isFinite(y)) {
        throw new ValidationError("Invalid year/month", "year/month");
      }

      const periodStart = new Date(Date.UTC(y, monthIndex, 1, 0, 0, 0, 0));
      const periodEnd = new Date(Date.UTC(y, monthIndex + 1, 0, 23, 59, 59, 999));

      // Safety: don't allow destructive deletion if the timesheet is locked/pending/approved.
      const submission = await db.timeSheetSubmission.findFirst({
        where: {
          userId: Number(userId),
          periodEnd: { gte: periodStart, lte: periodEnd },
        },
        orderBy: { updatedAt: "desc" },
      });

      const locked =
        submission?.status === "PENDING" ||
        submission?.status === "APPROVED" ||
        submission?.status === "LOCKED";
      if (locked) {
        throw new TimesheetLockedError();
      }

      const [sidebarResult, workHoursResult] = await db.$transaction([
        db.sidebarProject.deleteMany({
          where: {
            userId: Number(userId),
            projectKey,
            year: y,
            month: monthIndex,
          },
        }),
        db.workHours.deleteMany({
          where: {
            userId: Number(userId),
            projectId,
            date: { gte: periodStart, lte: periodEnd },
          },
        }),
      ]);

      if (sidebarResult.count < 1) {
        throw new RecordNotFoundError("Project", projectKey);
      }

      return NextResponse.json({
        message: "Project and its work hours deleted successfully",
        deletedSidebarProjects: sidebarResult.count,
        deletedWorkHours: workHoursResult.count,
      });
    }

    const result = await db.sidebarProject.deleteMany({
      where: {
        userId: Number(userId),
        projectKey,
        year,
        month,
      },
    });

    if(result.count < 1){
      throw new RecordNotFoundError("Project", projectKey)
    }

    return NextResponse.json({ message: "Project deleted successfully" });
    
  } catch (error) {
    return handleApiError(error)
  }
}