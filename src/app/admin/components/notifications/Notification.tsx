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
    ["VIEW_TIMESHEET", { label: "Review in Raports", goTo: "/admin?tab=raport" }],
    ["VIEW_ABSENCE", { label: "View Absences", goTo: "/admin?tab=modify-absences"}]
])

function buildActionUrl(
    baseUrl: string, 
    actionType: string | undefined, 
    senderUserId?: number,
    actionMonth?: number,
    actionYear?: number
): string {
    if (!senderUserId) return baseUrl;
    
    const params = new URLSearchParams();
    
    if (actionType === "VIEW_TIMESHEET") {
        params.set("tab", "raport");
        params.set("highlightUserId", senderUserId.toString());
        if (actionMonth) params.set("month", actionMonth.toString());
        if (actionYear) params.set("year", actionYear.toString());
    } else if (actionType === "VIEW_ABSENCE") {
        params.set("tab", "modify-absences");
        params.set("highlightUserId", senderUserId.toString());
    } else {
        return baseUrl;
    }
    
    return `/admin?${params.toString()}`;
}

export default function Notification({ notification, markAsRead = ()=>{}, children }: NotificationProps) {
    const action = actionMap.get(notification.actionType || "")
    const router = useRouter();

    function handleRead(){
        if(!notification.isRead) markAsRead(notification.id)
    }

    function handleActionClick() {
        if (!action) return;
        const url = buildActionUrl(
            action.goTo, 
            notification.actionType, 
            notification.senderUserId,
            notification.actionMonth,
            notification.actionYear
        );
        router.push(url);
    }

  return (
    <li onClick={handleRead} className={`flex flex-col p-3 bg-blue-50 rounded border-l-4 ${notification.isRead ? 'border-slate-400 bg-slate-50' : 'border-blue-500'}`}>
        <p className="text-md font-bold text-[#244B77]">{notification?.title || "No-Title"}</p>
        {notification?.message && <p className="text-sm text-gray-800">{notification?.message || "No-Message"}</p>}
        {children && children}
        {action && 
            <a className="w-fit my-1 text-[#244B77] text-sm font-bold cursor-pointer" onClick={handleActionClick}>{action.label}</a>
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
