"use client";
import { CreateNotificationInput, NotificationType, Notification } from "@/types/notification";
import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";

type NotificationContextType = {
    notifications: Notification[]
    unreadNotificationsCount: number
    createNotification: (type:keyof typeof NotificationType, notification: CreateNotificationInput) => void
    fetchAllNotifications: () => void
    fetchNotification: (notificationId:string) => Promise<Notification | null>
    markAsRead: (notificationId: string ) => void
    deleteReadNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([])

    const unreadNotificationsCount = useMemo(() => notifications.filter(notification => !notification.isRead).length, [notifications])

    function createNotification(type:keyof typeof NotificationType, notification: CreateNotificationInput){
        
    }

    async function fetchAllNotifications() {
        try {
            const response = await fetch('/api/notifications');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: {notifications: Notification[]} = await response.json();
            setNotifications((data?.notifications || []))
        } catch (err) {
            console.error("COULDN'T FETCH Notifications", err);
            setNotifications([]);
        }
    }

    useEffect(() => {
        fetchAllNotifications()
        const interval = setInterval(fetchAllNotifications, 3 * 60 * 1000) // 3 * 60 * 1000 = 3 minutes

        return () => clearInterval(interval);
    }, [])


    async function fetchNotification(notificationId:string):Promise<Notification | null>{
        return await fetch('mock_notification_data.json')
        .then(response => {
            if(response.ok) return response.json()
        })
        .then((data:Notification[]) => {
            const res =  data?.find(n => n.id === notificationId)
            if(res) return res
            return null
        })
        .catch(err => null)
    }


    async function markAsRead(notificationId: string ){
        try {
            const response = await fetch(`/api/notifications?id=${notificationId}`, {
                method: "PUT"
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: {message:string, notification:Notification} = await response.json()
            const updatedNotifications = notifications.map((n, i) => {
                if(n.id === data.notification.id) return data.notification
                return n
            })

            setNotifications(updatedNotifications)
        }
        catch(err){

        }
    }

    async function deleteReadNotifications() {
        try {
            const response = await fetch('/api/notifications?readOnly=true', {
                method: "DELETE"
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Remove read notifications from state
            const updatedNotifications = notifications.filter(n => !n.isRead)
            setNotifications(updatedNotifications)
        }
        catch(err){
            console.error("Failed to delete read notifications:", err)
        }
    }

  return (
    <NotificationContext.Provider value={{notifications, unreadNotificationsCount, createNotification, fetchAllNotifications, fetchNotification, markAsRead, deleteReadNotifications}}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
