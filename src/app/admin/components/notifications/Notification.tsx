"use client";

import { Notification as Notif } from "@/types/notification";
import { ReactNode } from "react";

type NotificationProps = {
    children?: ReactNode,
    markAsRead: (notificationId:string) => void
    notification: Notif
}

export default function Notification({ notification, markAsRead = ()=>{}, children }: NotificationProps) {

    function handleRead(){
        if(!notification.isRead) markAsRead(notification.id)
    }

  return (
    <li onClick={handleRead} className={`p-3 bg-blue-50 cursor-pointer active:cursor-default  rounded border-l-4 ${notification.isRead ? 'border-slate-400 bg-slate-50' : 'border-blue-500'}`}>
        <p className="text-md font-bold text-[#244B77]">{notification?.title || "No-Title"}</p>
        {notification?.message && <p className="text-sm text-gray-800">{notification?.message || "No-Message"}</p>}
        {children && children}
        <span className="text-xs text-gray-500">
            {new Date(notification?.createdAt).toLocaleDateString("sq-AL", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour:"2-digit",
                minute:"2-digit",
            })}
        </span>
    </li>
  )
}
