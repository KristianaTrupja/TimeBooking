import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/handlers";
import { AuthenticationError, ValidationError } from "@/lib/errors/errors";

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
      select: { company: true, title: true, projectKey: true },
    });
  
    const groupedProjects = rawProjects.reduce((acc, proj) => {
      if (!acc[proj.company]) acc[proj.company] = [];
      acc[proj.company].push({ title: proj.title, projectKey: proj.projectKey });
      return acc;
    }, {} as Record<string, { title: string; projectKey: string }[]>);
  
    const response = Object.entries(groupedProjects).map(([company, projects]) => ({
      company,
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
      throw new AuthenticationError("Unauthorized")
    }
  
    const userId = session.user.id;
    const body = await req.json();
    const { year, month, projects } = body;

    if (!year || !month || !Array.isArray(projects)) {
      throw new ValidationError("year and month are required!")
    }

    await db.sidebarProject.deleteMany({
      where: { userId: Number(userId), year, month },
    });

    for (const group of projects) {
      for (const project of group.projects) {
        const existing = await db.sidebarProject.findFirst({
          where: {
            userId: Number(userId),
            year,
            month,
            projectKey: project.projectKey,
          },
        });

        if (!existing) {
          await db.sidebarProject.create({
            data: {
              userId: Number(userId),
              company: group.company,
              title: project.title,
              projectKey: project.projectKey,
              year,
              month,
            },
          });
        }
      }
    }

    return NextResponse.json({ message: "Saved" });
    
  } catch (error) {
    return handleApiError(error)
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
    const { projectKey, year, month } = body;

    if (!projectKey || !year || !month) {
      throw new ValidationError("projectKey, year, and month are required", "projectKey/year/month")
    }

    await db.sidebarProject.deleteMany({
      where: {
        userId: Number(userId),
        projectKey,
        year,
        month,
      },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
    
  } catch (error) {
    return handleApiError(error)
  }
}