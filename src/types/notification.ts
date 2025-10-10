export enum NotificationType {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ACTION_REQUIRED = "ACTION_REQUIRED",
  APPROVAL_REQUEST = "APPROVAL_REQUEST",
}

export type Notification = {
    id: string
    userId:number
    title: string
    message: string
    type: keyof typeof NotificationType

    isRead: boolean
    createdAt:Date

    actionType?: string
    actionUrl?: string
    actionData?: JSON
}

export type CreateNotificationInput = Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt' | 'type'>