// lib/notifications.ts
import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

interface NotifyUsersParams {
  role: string;
  title: string;
  message: string;
  type: NotificationType;
  actionType?: string;
  actionUrl?: string;
  actionData?: any;
}

/**
 * Creates notifications for all users with a specific role.
 * This function is "forgiving" - it catches errors and logs them without throwing.
 * @returns Object with success status and notification count
 */
export async function notifyUsersByRole({
  role,
  title,
  message,
  type,
  actionType,
  actionUrl,
  actionData,
}: NotifyUsersParams) {
  try {
    // Get all users with the specified role
    const users = await db.user.findMany({
      where: { role },
      select: { id: true },
    });

    if (users.length === 0) {
      console.warn(`No users found with role: ${role}`);
      return { success: true, count: 0 };
    }

    // Prepare notification data for all users
    const notificationData = users.map((user) => ({
      userId: user.id,
      title,
      message,
      type,
      actionType,
      actionUrl,
      actionData,
    }));

    // Create all notifications at once
    await db.notifications.createMany({
      data: notificationData,
      skipDuplicates: true,
    });

    console.log(`Created ${notificationData.length} notifications for role: ${role}`);
    return { success: true, count: notificationData.length };
  } catch (error) {
    console.error(`Failed to notify users with role ${role}:`, error);
    return { success: false, error, count: 0 };
  }
}

/**
 * Creates a notification for a specific user
 */
export async function notifyUser(
  userId: number,
  notificationData: Omit<NotifyUsersParams, "role">
) {
  try {
    await db.notifications.create({
      data: {
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        actionType: notificationData.actionType,
        actionUrl: notificationData.actionUrl,
        actionData: notificationData.actionData,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to notify user ${userId}:`, error);
    return { success: false, error };
  }
}
