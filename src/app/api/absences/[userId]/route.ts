import { getBusinessDays } from "@/app/utils/dateUtils";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AbsenceType } from "@/types/absence";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function GET(req: Request, { params }: { params: Promise<{ userId: string }>}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { userId } = await params
  try {

    return NextResponse.json({ days: 1 }, { status: 200 })
  } catch (error) {
    console.error("Error fetching absences:", error)
    return NextResponse.json({ message: "Failed to fetch absences" }, { status: 500 })
  }
}



