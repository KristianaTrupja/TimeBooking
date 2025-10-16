import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { getEndOfMonth, getStartOfMonth } from '@/app/utils/dateUtils';

// GET: Fetch work hours
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!userId || !month || !year) {
    return NextResponse.json({ error: 'Missing required parameters, userId or month and year' }, { status: 400 });
  }

  try {
    const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const periodEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    // Fetch ALL work hours for the period, regardless of submission status
    const workhours = await db.workHours.findMany({
      where: {
        userId: parseInt(userId),
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            company: true,
            project: true,
          },
        },
        submission: true,  // Include submission info if it exists
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Separately fetch submission (may not exist for draft/legacy periods)
    const submission = await db.timeSheetSubmission.findUnique({
      where: {
        userId_periodStart_periodEnd: {
          userId: parseInt(userId),
          periodStart,
          periodEnd,
        },
      },
    });

    const totalHours = workhours.reduce((sum, entry) => sum + entry.hours, 0)

    const isLocked = submission?.status === 'PENDING' || 
                     submission?.status === 'APPROVED' || 
                     submission?.status === 'LOCKED'

    const canEdit = submission?.status === 'DRAFT' || 
                    submission?.status === 'REJECTED' || 
                    !submission

    const response = {
      submission: submission || null,
      workhours,
      metadata: {
        totalHours,
        isLocked,
        canEdit,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching work hours:", error);
    return NextResponse.json({ error: "Failed to fetch work hours" }, { status: 500 });
  }
}

// POST: Create new work entry
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, hours, note, userId, projectId } = body;

  if (!date || !hours || !userId || !projectId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const targetDate = new Date(date);
    const periodStart = getStartOfMonth(targetDate);
    const periodEnd = getEndOfMonth(targetDate);

    const entry = await db.$transaction(async (tx) => {
      const submission = await tx.timeSheetSubmission.upsert({
        where: {
          userId_periodStart_periodEnd: {
            userId,
            periodStart,
            periodEnd,
          },
        },
        update: {},
        create: {
          userId,
          periodStart,
          periodEnd,
          status: "DRAFT",
        },
      });

      if (submission.status === "LOCKED") {
        throw new Error("Timesheet for this month is locked");
      }

    const workingHours = await tx.workHours.upsert({
      where: {
        userId_date_projectId: {
          userId,
          date: targetDate,
          projectId,
        },
      },
      update: {
        hours,
        note,
        submissionId: submission.id
      },
      create: {
        date: targetDate,
        hours,
        note,
        userId,
        projectId,
        submissionId: submission.id,
      },
    });
      return workingHours;
  });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating or updating workHours:", error);
    return NextResponse.json({ error: "Could not create or update work entry" }, { status: 400 });
  }
}


// PUT: Update hours or note for existing entry
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { date, userId, projectId, hours, note } = body;

  if (!date || !userId || !projectId || typeof hours !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const updated = await db.workHours.upsert({
      where: {
        userId_date_projectId: {
          userId,
          date: new Date(date),
          projectId,
        },
      },
      update: {
        hours,
        note,
      },
      create: {
        userId,
        date: new Date(date),
        projectId,
        hours,
        note,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Could not update work entry' }, { status: 500 });
  }
}

// DELETE: Remove a work entry
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const date = searchParams.get('date');
  const projectId = searchParams.get('projectId');

  if (!userId || !date || !projectId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await db.workHours.delete({
      where: {
        userId_date_projectId: {
          userId: parseInt(userId),
          date: new Date(date),
          projectId: parseInt(projectId),
        },
      },
    });

    return NextResponse.json({ message: 'Work entry deleted successfully' });
  } catch (error) {
    console.error("Error deleting work entry:", error);
    return NextResponse.json({ error: 'Could not delete work entry' }, { status: 500 });
  }
}