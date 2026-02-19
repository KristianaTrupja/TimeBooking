import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/handlers";
import { AuthenticationError } from "@/lib/errors/errors";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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

    const holidays = await db.holidays.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        holiday: true
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
