import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, holiday } = body;
    // ✅ Validate before inserting into DB
    if (
      !date ||
      !holiday ||
      typeof date !== "string" ||
      typeof holiday !== "string"
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const newHoliday = await db.holidays.create({
      data: { date, holiday },
    });

    return NextResponse.json(
      { holiday: newHoliday, message: "Holiday created successfully" },
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
    console.error("Error fetching holidays:", error);
    return NextResponse.json(
      { message: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Holiday ID is required" },
        { status: 400 }
      );
    }

    await db.holidays.delete({ where: { id } });
    return NextResponse.json(
      { message: "Holiday deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json(
      { message: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id, date, holiday } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Holiday ID is required" },
        { status: 400 }
      );
    }
    if (
      !date ||
      !holiday ||
      typeof date !== "string" ||
      typeof holiday !== "string"
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const updatedHoliday = await db.holidays.update({
      where: { id },
      data: { date, holiday },
    });

    return NextResponse.json({ holiday: updatedHoliday }, { status: 200 });
  } catch (error) {
    console.error("Error updating holiday:", error);
    return NextResponse.json(
      { message: "Failed to update holiday" },
      { status: 500 }
    );
  }
}
