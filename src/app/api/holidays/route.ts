import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/handlers";
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from "@/lib/errors/errors";

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

async function resolveLocationId(req: Request, requester: Requester) {
  const { searchParams } = new URL(req.url);
  const locationIdParam = searchParams.get("locationId");
  const userIdParam = searchParams.get("userId");

  if (locationIdParam) {
    const locationId = Number(locationIdParam);
    if (!Number.isInteger(locationId) || locationId <= 0) {
      throw new ValidationError("Invalid location id", "locationId");
    }

    if (requester.role !== "Admin" && requester.locationId !== locationId) {
      throw new AuthorizationError("Forbidden");
    }

    return locationId;
  }

  if (userIdParam) {
    const userId = Number(userIdParam);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ValidationError("Invalid user id", "userId");
    }

    if (requester.role !== "Admin" && requester.id !== userId) {
      throw new AuthorizationError("Forbidden");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, locationId: true },
    });

    if (!user?.isActive) {
      throw new ValidationError("Invalid user id", "userId");
    }

    return user.locationId;
  }

  return requester.locationId;
}

export async function GET(req: Request) {
  try {
    const requester = await getRequester();

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const allLocations = searchParams.get("allLocations") === "true";

    let whereClause = {};

    if (year) {
      const yearNum = parseInt(year);
      whereClause = {
        date: {
          gte: `${yearNum}-01-01`,
          lte: `${yearNum}-12-31`
        }
      };
    } else if (startDate && endDate) {
      whereClause = {
        date: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    if (!allLocations) {
      const locationId = await resolveLocationId(req, requester);
      whereClause = {
        ...whereClause,
        locationId,
      };
    }

    const holidays = await db.holidays.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        holiday: true,
        locationId: true,
      },
      orderBy: {
        date: 'asc'
      }
    });

    return NextResponse.json({ holidays });
  } catch (error) {
    return handleApiError(error);
  }
}
