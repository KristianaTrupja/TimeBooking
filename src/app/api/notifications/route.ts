import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
  try {
    const res = await db.notifications.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ notifications: res || [], message: "Fetch all notifications API hit!"}, { status: 200 })
  } catch (error) {
    console.error("Error fetching absences:", error)
    return NextResponse.json({ message: "Failed to fetch absences" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    return NextResponse.json(
      { message: "Notification Creation API hit!" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating absence:", error.message || error);
    return NextResponse.json(
      { message: error.message || "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    try {
        const { searchParams } = new URL(req.url);
        const notificationId = searchParams.get("id");
        
        if(!notificationId) return NextResponse.json({ message: "No notification ID was provided!" }, { status: 400 });
        
        const updatedNotification = await db.notifications.update({
      where: { id:notificationId, userId:Number(userId), isRead:false},
      data: {
        isRead:true
      },
    })

    return NextResponse.json({ notification: updatedNotification || null, message: "Notification marked as read!" }, { status: 200 });
  } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Notification not found or already read" }, 
          { status: 404 }
        );
      }
    }
    
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { message: "Failed to mark notification as read" }, 
      { status: 500 }
    );
  }
}
  



