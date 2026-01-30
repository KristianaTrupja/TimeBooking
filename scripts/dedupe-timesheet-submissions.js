const { PrismaClient, SubmissionStatus } = require("@prisma/client");

const prisma = new PrismaClient();

// Higher number = more "final"
const statusRank = {
  [SubmissionStatus.DRAFT]: 0,
  [SubmissionStatus.REJECTED]: 1,
  [SubmissionStatus.PENDING]: 2,
  [SubmissionStatus.APPROVED]: 3,
  [SubmissionStatus.LOCKED]: 4,
};

function ymFromDate(d) {
  // Use UTC so it matches our canonical period boundaries
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

async function main() {
  if (process.env.CONFIRM_DEDUPE !== "yes") {
    throw new Error(
      "Refusing to run. Set CONFIRM_DEDUPE=yes to proceed (this will MODIFY your database)."
    );
  }

  console.log("Loading submissions...");
  const subs = await prisma.timeSheetSubmission.findMany({
    select: {
      id: true,
      userId: true,
      periodEnd: true,
      status: true,
      updatedAt: true,
    },
    orderBy: [{ userId: "asc" }, { updatedAt: "desc" }],
  });

  console.log("Backfilling periodYear/periodMonth...");
  for (const s of subs) {
    const { y, m } = ymFromDate(s.periodEnd);
    await prisma.timeSheetSubmission.update({
      where: { id: s.id },
      data: { periodYear: y, periodMonth: m },
    });
  }

  const subs2 = await prisma.timeSheetSubmission.findMany({
    select: {
      id: true,
      userId: true,
      periodYear: true,
      periodMonth: true,
      status: true,
      updatedAt: true,
    },
    orderBy: [{ userId: "asc" }, { updatedAt: "desc" }],
  });

  const groups = new Map();
  for (const s of subs2) {
    const key = `${s.userId}-${s.periodYear}-${s.periodMonth}`;
    const arr = groups.get(key) || [];
    arr.push(s);
    groups.set(key, arr);
  }

  let dedupedGroups = 0;
  let deleted = 0;
  let relinked = 0;

  console.log("Deduping groups...");
  for (const [key, arr] of groups.entries()) {
    if (arr.length <= 1) continue;

    const sorted = [...arr].sort((a, b) => {
      const r = statusRank[b.status] - statusRank[a.status];
      if (r !== 0) return r;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    const keep = sorted[0];
    const drop = sorted.slice(1);
    const dropIds = drop.map((d) => d.id);

    const relink = await prisma.workHours.updateMany({
      where: { submissionId: { in: dropIds } },
      data: { submissionId: keep.id },
    });
    relinked += relink.count;

    const del = await prisma.timeSheetSubmission.deleteMany({
      where: { id: { in: dropIds } },
    });
    deleted += del.count;

    dedupedGroups += 1;
    console.log(`Deduped ${key}: kept ${keep.id} (${keep.status}), deleted [${dropIds.join(", ")}]`);
  }

  console.log(
    `Done. Groups deduped: ${dedupedGroups}, submissions deleted: ${deleted}, workHours relinked: ${relinked}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

