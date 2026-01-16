import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company: companyName, project } = body;

    if(!companyName || !project) throw new ValidationError("company, project fields are required!", "company/project")

    // Find or create company
    let company = await db.company.findUnique({
      where: { name: companyName.trim() }
    });

    if (!company) {
      company = await db.company.create({
        data: { name: companyName.trim() }
      });
    }

    const newProject = await db.projects.create({
      data: { 
        companyId: company.id, 
        project: project.trim() 
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json(
      { project: newProject, message: "Project created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const projects = await db.projects.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            isActive: true,
            deletedAt: true,
          }
        }
      },
    });

    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId")
    const { project } = await req.json();

    if (!projectId || !project || !project) {
      throw new ValidationError("Project ID and project are required", "id/project")
    }

    const updatedProject = await db.projects.update({
      where: { id: Number(projectId) },
      data: { project },
    });

    return NextResponse.json(
      { project: updatedProject, message: "Project updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId")
    if (!projectId) {
      throw new ValidationError("Project ID is required", "id")
    }

    const projectIdNum = Number(projectId);

    // Check if project has any related data
    const [workHoursCount, sidebarProjectsCount] = await Promise.all([
      db.workHours.count({ where: { projectId: projectIdNum } }),
      db.sidebarProject.count({ 
        where: { 
          projectKey: `PID-${projectIdNum}`
        } 
      }),
    ]);

    const hasRelatedData = workHoursCount > 0 || sidebarProjectsCount > 0;

    if (hasRelatedData) {
      // Soft delete: set isActive to false and record deletion timestamp
      await db.projects.update({
        where: { id: projectIdNum },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
      
      return NextResponse.json(
        { message: "Project deactivated successfully. Historical data has been preserved." },
        { status: 200 }
      );
    } else {
      // Hard delete: project has no related data, safe to remove completely
      await db.projects.delete({ where: { id: projectIdNum } });
      
      return NextResponse.json(
        { message: "Project deleted successfully." },
        { status: 200 }
      );
    }
  } catch (error) {
    return handleApiError(error)
  }
}
