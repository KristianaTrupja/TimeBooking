import { db } from "@/lib/db";
import { withLogging } from "@/lib/withLogging";
import { NextResponse } from "next/server";

async function Post(req: Request) {
  try {
    const body = await req.json();
    const { company, project } = body;

    const newProject = await db.projects.create({
      data: { company, project },
    });

    return NextResponse.json(
      { project: newProject, message: "Holiday created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

async function Get() {
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
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

async function Put(req: Request) {
  try {
    const body = await req.json();
    const { id, company, project } = body;

    if (!id || !company || !project) {
      return NextResponse.json(
        { message: "ID, company and project are required" },
        { status: 400 }
      );
    }

    const updatedProject = await db.projects.update({
      where: { id },
      data: { company, project },
    });

    return NextResponse.json(
      { project: updatedProject, message: "Project updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { message: "Failed to update project" },
      { status: 500 }
    );
  }
}

async function Delete(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { message: "Project ID is required" },
        { status: 400 }
      );
    }

    await db.projects.delete({ where: { id } });
    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { message: "Failed to delete project" },
      { status: 500 }
    );
  }
}


export const POST = withLogging(Post);
export const GET = withLogging(Get);
export const PUT = withLogging(Put);
export const DELETE = withLogging(Delete);