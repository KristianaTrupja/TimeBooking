import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, holiday } = body;

    if (
      !date ||
      !holiday ||
      typeof date !== "string" ||
      typeof holiday !== "string"
    ) {
      throw new ValidationError("Missing required fields: date and holiday", 'date/holiday')
    }

    const newHoliday = await db.holidays.create({
      data: { date, holiday },
    });

    return NextResponse.json(
      { holiday: newHoliday, message: "Holiday created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(req: Request) {
  try {
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
          date: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          date: true,
          holiday: true,
        },
      });
    } else {
      holidays = await db.holidays.findMany({
        select: {
          id: true,
          date: true,
          holiday: true,
        },
      });
    }

    const formatted = holidays.map(({ id, date, holiday }) => ({
      id,
      date,
      title: holiday,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      throw new ValidationError("Holiday ID is required")
    }

    await db.holidays.delete({ where: { id } });
    return NextResponse.json(
      { message: "Holiday deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(req: Request) {
  try {
    const { id, date, holiday } = await req.json();

    if (!id) {
      throw new ValidationError("Holiday ID is required", 'id')
    }
    if (
      !date ||
      !holiday ||
      typeof date !== "string" ||
      typeof holiday !== "string"
    ) {
      throw new ValidationError("Missing required fields: date and holiday", 'date/holiday')
    }

    const updatedHoliday = await db.holidays.update({
      where: { id },
      data: { date, holiday },
    });

    return NextResponse.json({ holiday: updatedHoliday }, { status: 200 });
  } catch (error) {
    return handleApiError(error)
  }
}
