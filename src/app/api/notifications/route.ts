import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthenticationError, ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/handlers";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }

    const userId = session.user.id;
    const res = await db.notifications.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ notifications: res || [], message: "Fetch all notifications API hit!"}, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

// export async function POST(req: Request) {
//   try {
//     return NextResponse.json(
//       { message: "Notification Creation API hit!" },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     return handleApiError(error)
//   }
// }


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new AuthenticationError("Unauthorized");

    const userId = Number(session.user.id);
    const { searchParams } = new URL(req.url);
    const markAllAsRead = searchParams.get("markAllAsRead") === "true";

    if (markAllAsRead) {
      const result = await db.notifications.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      const notifications = await db.notifications.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(
        {
          message: `Marked ${result.count} notification(s) as read`,
          updatedCount: result.count,
          notifications,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "Mark all notifications as read API hit!" }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}


export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
    const userId = session.user.id;
        const { searchParams } = new URL(req.url);
        const notificationId = searchParams.get("id");
        
        if(!notificationId) {
          throw new ValidationError("No notification ID was provided!", "id")
        }
        
        const updatedNotification = await db.notifications.update({
      where: { id:notificationId, userId:Number(userId), isRead:false},
      data: {
        isRead:true
      },
    })

    return NextResponse.json({ notification: updatedNotification || null, message: "Notification marked as read!" }, { status: 200 });
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized")
    }
    
    const userId = Number(session.user.id);
    const { searchParams } = new URL(req.url);
    const deleteRead = searchParams.get("readOnly");
    
    if (deleteRead === "true") {
      // Delete all read notifications for this user
      const result = await db.notifications.deleteMany({
        where: {
          userId,
          isRead: true,
        },
      });

      return NextResponse.json(
        { 
          message: `Deleted ${result.count} read notification(s) successfully`,
          deletedCount: result.count 
        },
        { status: 200 }
      );
    } else {
      // Delete a specific notification
      const notificationId = searchParams.get("id");
      
      if (!notificationId) {
        throw new ValidationError("No notification ID was provided!", "id");
      }

      await db.notifications.delete({
        where: {
          id: notificationId,
          userId,
        },
      });

      return NextResponse.json(
        { message: "Notification deleted successfully" },
        { status: 200 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}


