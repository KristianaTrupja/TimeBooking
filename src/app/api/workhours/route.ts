import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { getEndOfMonth, getStartOfMonth } from '@/app/utils/dateUtils';
import { handleApiError } from '@/lib/errors/handlers';
import { AuthenticationError, AuthorizationError, TimesheetLockedError, ValidationError } from '@/lib/errors/errors';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await req.json();
    const { date, hours, note, userId, projectId } = body;
    if (!date || (hours < 0) || !userId || !projectId) {
      throw new ValidationError('Missing required fields', 'date/hours/userId/projectId')
    }

    if(userId != session?.user?.id){
      throw new AuthorizationError("FORBIDDEN: You are not authorized to modify these working hours")
    }

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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }
    const body = await req.json();
    const { date, userId, projectId, hours, note } = body;
    if(userId != session?.user?.id){
      throw new AuthorizationError("FORBIDDEN: You are not authorized to modify these working hours")
    }

  if (!date || !userId || !projectId || typeof hours !== 'number') {
    throw new ValidationError('Missing required fields', 'date/userId/projectId')
  }

    const targetDate = new Date(date);
    const periodStart = getStartOfMonth(targetDate);
    const periodEnd = getEndOfMonth(targetDate);

    const updated = await db.$transaction(async (tx) => {
      // Ensure submission exists for this period
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

      // Update or create work hours and link to submission
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
          submissionId: submission.id,
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

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH: Batch save multiple work hours
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await req.json();
    const { workHours } = body;

    if (!Array.isArray(workHours) || workHours.length === 0) {
      throw new ValidationError('workHours must be a non-empty array', 'workHours');
    }

    // Validate all entries belong to the authenticated user
    const sessionUserId = parseInt(String(session.user.id), 10);
    const invalidEntries = workHours.filter((entry: any) => entry.userId !== sessionUserId);
    if (invalidEntries.length > 0) {
      throw new AuthorizationError("FORBIDDEN: You are not authorized to modify these working hours");
    }

    // Process all work hours in a single transaction
    const results = await db.$transaction(async (tx) => {
      const savedEntries = [];

      // Group work hours by period (userId + periodStart + periodEnd)
      const periodGroups = new Map<string, {
        userId: number;
        periodStart: Date;
        periodEnd: Date;
        entries: typeof workHours;
      }>();

      // Validate and group entries
      for (const entry of workHours) {
        const { date, hours, note, userId, projectId } = entry;

        if (!date || typeof hours !== 'number' || hours < 0 || !userId || !projectId) {
          throw new ValidationError('Invalid work hour entry', 'date/hours/userId/projectId');
        }

        const targetDate = new Date(date);
        const periodStart = getStartOfMonth(targetDate);
        const periodEnd = getEndOfMonth(targetDate);
        const periodKey = `${userId}-${periodStart.getTime()}-${periodEnd.getTime()}`;

        if (!periodGroups.has(periodKey)) {
          periodGroups.set(periodKey, {
            userId,
            periodStart,
            periodEnd,
            entries: [],
          });
        }

        periodGroups.get(periodKey)!.entries.push(entry);
      }

      // Process each period group
      for (const [periodKey, group] of periodGroups) {
        const { userId, periodStart, periodEnd, entries } = group;

        // Ensure submission exists once per period
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
          throw new TimesheetLockedError();
        }

        // Save all work hours for this period
        for (const entry of entries) {
          const { date, hours, note, projectId } = entry;
          const targetDate = new Date(date);

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
              submissionId: submission.id,
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

          savedEntries.push(workingHours);
        }
      }

      return savedEntries;
    });

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      message: `Successfully saved ${results.length} work hour entries` 
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: Remove a work entry
export async function DELETE(req: NextRequest) {
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    const projectId = searchParams.get('projectId');
    if(userId != session?.user?.id){
      throw new AuthorizationError("FORBIDDEN: You are not authorized to delete these working hours")
    }

  if (!userId || !date || !projectId) {
    throw new ValidationError('Missing required fields', 'userId/date/projectId')
  }
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
