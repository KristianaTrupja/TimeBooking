"use client";

import { Notification as Notif } from "@/types/notification";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

type NotificationProps = {
    children?: ReactNode,
    markAsRead: (notificationId:string) => void
    notification: Notif
}

const actionMap = new Map([
    ["VIEW_TIMESHEET", { label: "Review in TimeSheet", goTo: "/admin?tab=timesheets" }],
    ["VIEW_ABSENCE", { label: "View Absences", goTo: "/admin?tab=modify-absences"}]
])

export default function Notification({ notification, markAsRead = ()=>{}, children }: NotificationProps) {
    const action = actionMap.get(notification.actionType || "")
    const router = useRouter();

    function handleRead(){
        if(!notification.isRead) markAsRead(notification.id)
    }


  return (
    <li onClick={handleRead} className={`flex flex-col p-3 bg-blue-50 rounded border-l-4 ${notification.isRead ? 'border-slate-400 bg-slate-50' : 'border-blue-500'}`}>
        <p className="text-md font-bold text-[#244B77]">{notification?.title || "No-Title"}</p>
        {notification?.message && <p className="text-sm text-gray-800">{notification?.message || "No-Message"}</p>}
        {children && children}
        {action && 
            <a className="w-fit my-1 text-[#244B77] text-sm font-bold cursor-pointer" onClick={() => router.push(action.goTo)}>{action.label}</a>
        }
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
