import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";

async function getRequester() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError("Unauthorized");
  }

  const requester = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { id: true, role: true, isActive: true },
  });

  if (!requester?.isActive) {
    throw new AuthorizationError("Forbidden");
  }

  return requester;
}

export async function GET() {
  try {
    await getRequester();

    const locations = await db.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ locations }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const requester = await getRequester();
    if (requester.role !== "Admin") {
      throw new AuthorizationError("Only administrators can create locations");
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      throw new ValidationError("Location name is required", "name");
    }

    const existing = await db.location.findFirst({
      where: {
        name: {
          equals: name,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictError("Location with this name already exists", undefined, { field: "name" });
    }

    const location = await db.location.create({
      data: { name },
      select: { id: true, name: true },
    });

    return NextResponse.json(
      { location, message: "Location created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
