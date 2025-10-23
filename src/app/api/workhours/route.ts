import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { getEndOfMonth, getStartOfMonth } from '@/app/utils/dateUtils';
import { handleApiError } from '@/lib/errors/handlers';
import { TimesheetLockedError, ValidationError } from '@/lib/errors/errors';

// GET: Fetch work hours
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!userId || !month || !year) {
    throw new ValidationError('Missing required parameters, userId or month and year','userId/month/year')
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
    return handleApiError(error)
  }
}

// POST: Create new work entry
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, hours, note, userId, projectId } = body;

  if (!date || !hours || !userId || !projectId) {
    throw new ValidationError('Missing required fields', 'date/hours/userId/projectId')
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
        throw new TimesheetLockedError()
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
    return handleApiError(error)
  }
}


// PUT: Update hours or note for existing entry
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { date, userId, projectId, hours, note } = body;

  if (!date || !userId || !projectId || typeof hours !== 'number') {
    throw new ValidationError('Missing required fields', 'date/userId/projectId')
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
    return handleApiError(error)
  }
}

// DELETE: Remove a work entry
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const date = searchParams.get('date');
  const projectId = searchParams.get('projectId');

  if (!userId || !date || !projectId) {
    throw new ValidationError('Missing required fields', 'userId/date/projectId')
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
    return handleApiError(error)
  }
}
