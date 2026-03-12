import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      username: true,
      locationId: true,
      location: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      id: user.id,
      role: user.role,
      username: user.username,
      locationId: user.locationId,
      locationName: user.location?.name ?? null,
    },
    { status: 200 }
  );
}

