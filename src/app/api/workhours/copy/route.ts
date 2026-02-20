import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { handleApiError } from '@/lib/errors/handlers';
import { AuthenticationError, AuthorizationError, ValidationError } from '@/lib/errors/errors';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getPeriodBoundsUTCFromYearMonth(year: number, month: number) {
  const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { periodStart, periodEnd };
}

// POST: Copy work hours from one month to another
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await req.json();
    const { userId, fromMonth, fromYear, toMonth, toYear } = body;

    if (!userId || !fromMonth || !fromYear || !toMonth || !toYear) {
      throw new ValidationError('Missing required parameters', 'userId/fromMonth/fromYear/toMonth/toYear');
    }

    const sessionUserId = parseInt(String(session.user.id), 10);
    const requestUserId = parseInt(String(userId), 10);
    
    if (requestUserId !== sessionUserId) {
      throw new AuthorizationError("FORBIDDEN: You are not authorized to copy work hours for this user");
    }

    // Get period bounds for source and destination months
    const { periodStart: fromPeriodStart, periodEnd: fromPeriodEnd } = getPeriodBoundsUTCFromYearMonth(fromYear, fromMonth);
    const { periodStart: toPeriodStart, periodEnd: toPeriodEnd } = getPeriodBoundsUTCFromYearMonth(toYear, toMonth);

    // Check if destination month is locked
    const toSubmission = await db.timeSheetSubmission.findFirst({
      where: {
        userId: requestUserId,
        periodStart: toPeriodStart,
        periodEnd: toPeriodEnd,
      },
    });

    if (toSubmission && (toSubmission.status === 'PENDING' || toSubmission.status === 'APPROVED' || toSubmission.status === 'LOCKED')) {
      throw new ValidationError('Cannot copy to a locked period', 'toMonth');
    }

    // Fetch work hours from source month
    const sourceWorkHours = await db.workHours.findMany({
      where: {
        userId: requestUserId,
        date: {
          gte: fromPeriodStart,
          lte: fromPeriodEnd,
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
      },
    });

    if (sourceWorkHours.length === 0) {
      return NextResponse.json({ 
        message: 'No work hours found in the source month',
        copied: 0 
      }, { status: 200 });
    }

    // Copy work hours to destination month
    const results = await db.$transaction(async (tx) => {
      // Ensure destination submission exists
      const submission = await tx.timeSheetSubmission.upsert({
        where: {
          userId_periodStart_periodEnd: {
            userId: requestUserId,
            periodStart: toPeriodStart,
            periodEnd: toPeriodEnd,
          },
        },
        update: {},
        create: {
          userId: requestUserId,
          periodStart: toPeriodStart,
          periodEnd: toPeriodEnd,
          status: "DRAFT",
        },
      });

      const copiedEntries = [];

      // Map each work hour entry to the corresponding date in the destination month
      for (const sourceEntry of sourceWorkHours) {
        const sourceDate = new Date(sourceEntry.date);
        const dayOfMonth = sourceDate.getUTCDate();
        
        // Calculate the target date in the destination month
        // Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
        const daysInToMonth = new Date(Date.UTC(toYear, toMonth, 0)).getUTCDate();
        const targetDay = Math.min(dayOfMonth, daysInToMonth);
        const targetDate = new Date(Date.UTC(toYear, toMonth - 1, targetDay, 0, 0, 0, 0));

        try {
          const copiedEntry = await tx.workHours.upsert({
            where: {
              userId_date_projectId: {
                userId: requestUserId,
                date: targetDate,
                projectId: sourceEntry.projectId,
              },
            },
            update: {
              hours: sourceEntry.hours,
              note: sourceEntry.note,
              submissionId: submission.id,
            },
            create: {
              date: targetDate,
              hours: sourceEntry.hours,
              note: sourceEntry.note,
              userId: requestUserId,
              projectId: sourceEntry.projectId,
              submissionId: submission.id,
            },
          });

          copiedEntries.push(copiedEntry);
        } catch (error) {
          console.error(`Failed to copy entry for date ${targetDate}:`, error);
          // Continue with other entries even if one fails
        }
      }

      return copiedEntries;
    });

    return NextResponse.json({ 
      message: `Successfully copied ${results.length} work hour entries`,
      copied: results.length 
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
