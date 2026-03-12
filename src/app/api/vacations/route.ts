import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type Requester = {
  id: number;
  role: string;
  isActive: boolean;
  locationId: number;
};

async function getRequester(): Promise<Requester> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthenticationError("Unauthorized");
  }

  const requester = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { id: true, role: true, isActive: true, locationId: true },
  });

  if (!requester?.isActive) {
    throw new AuthorizationError("Forbidden");
  }

  return requester;
}

async function ensureLocationExists(locationId: number) {
  const location = await db.location.findUnique({
    where: { id: locationId },
    select: { id: true },
  });

  if (!location) {
    throw new ValidationError("Selected location does not exist", "locationId");
  }
}

async function resolveLocationId(req: Request, requester: Requester) {
  const { searchParams } = new URL(req.url);
  const locationIdParam = searchParams.get("locationId");
  const userIdParam = searchParams.get("userId");

  if (locationIdParam) {
    const locationId = Number(locationIdParam);
    if (!Number.isInteger(locationId) || locationId <= 0) {
      throw new ValidationError("Invalid location id", "locationId");
    }

    if (requester.role !== "Admin" && locationId !== requester.locationId) {
      throw new AuthorizationError("Forbidden");
    }

    await ensureLocationExists(locationId);
    return locationId;
  }

  if (userIdParam) {
    const userId = Number(userIdParam);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ValidationError("Invalid user id", "userId");
    }

    if (requester.role !== "Admin" && userId !== requester.id) {
      throw new AuthorizationError("Forbidden");
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, locationId: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      throw new ValidationError("Invalid user id", "userId");
    }

    return targetUser.locationId;
  }

  return requester.locationId;
}

export async function POST(req: Request) {
  try {
    const requester = await getRequester();
    if (requester.role !== "Admin") {
      throw new AuthorizationError("Only administrators can manage holidays");
    }

    const body = await req.json();
    const { date, holiday, locationId: locationIdRaw } = body;

    if (
      !date ||
      !holiday ||
      typeof date !== "string" ||
      typeof holiday !== "string"
    ) {
      throw new ValidationError("Missing required fields: date and holiday", "date/holiday");
    }

    const locationId = Number(locationIdRaw);
    if (!Number.isInteger(locationId) || locationId <= 0) {
      throw new ValidationError("A valid location is required", "locationId");
    }
    await ensureLocationExists(locationId);

    const newHoliday = await db.holidays.create({
      data: { date, holiday, locationId },
    });

    return NextResponse.json(
      { holiday: newHoliday, message: "Holiday created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: Request) {
  try {
    const requester = await getRequester();
    const locationId = await resolveLocationId(req, requester);
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let holidays;

    if (year && month) {
      const start = `${year}-${month.padStart(2, "0")}-01`;
      const end = new Date(Number(year), Number(month), 0)
        .toISOString()
        .split("T")[0];

      holidays = await db.holidays.findMany({
        where: {
          locationId,
          date: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          date: true,
          holiday: true,
          locationId: true,
        },
      });
    } else if (year) {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;

      holidays = await db.holidays.findMany({
        where: {
          locationId,
          date: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          date: true,
          holiday: true,
          locationId: true,
        },
      });
    } else {
      holidays = await db.holidays.findMany({
        where: { locationId },
        select: {
          id: true,
          date: true,
          holiday: true,
          locationId: true,
        },
      });
    }

    const formatted = holidays.map(({ id, date, holiday, locationId: holidayLocationId }) => ({
      id,
      date,
      title: holiday,
      locationId: holidayLocationId,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const requester = await getRequester();
    if (requester.role !== "Admin") {
      throw new AuthorizationError("Only administrators can manage holidays");
    }

    const { id } = await req.json();
    if (!id) {
      throw new ValidationError("Holiday ID is required", "id");
    }

    await db.holidays.delete({ where: { id } });
    return NextResponse.json(
      { message: "Holiday deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const requester = await getRequester();
    if (requester.role !== "Admin") {
      throw new AuthorizationError("Only administrators can manage holidays");
    }

    const { id, date, holiday, locationId: locationIdRaw } = await req.json();

    if (!id) {
      throw new ValidationError("Holiday ID is required", "id");
    }
    if (
      !date ||
      !holiday ||
      typeof date !== "string" ||
      typeof holiday !== "string"
    ) {
      throw new ValidationError("Missing required fields: date and holiday", "date/holiday");
    }

    const locationId = Number(locationIdRaw);
    if (!Number.isInteger(locationId) || locationId <= 0) {
      throw new ValidationError("A valid location is required", "locationId");
    }
    await ensureLocationExists(locationId);

    const updatedHoliday = await db.holidays.update({
      where: { id },
      data: { date, holiday, locationId },
    });

    return NextResponse.json({ holiday: updatedHoliday }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
