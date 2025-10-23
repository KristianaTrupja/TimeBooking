import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company, project } = body;

    if(!company || !project) throw new ValidationError("company, project fields are required!", "company/project")

    const newProject = await db.projects.create({
      data: { company, project },
    });

    return NextResponse.json(
      { project: newProject, message: "Project created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const projects = await db.projects.findMany({
      select: {
        id: true,
        company: true,
        project: true,
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

    await db.projects.delete({ where: { id:Number(projectId) } });
    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}
