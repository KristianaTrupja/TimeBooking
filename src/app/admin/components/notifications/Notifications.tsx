"use client";

import { Bell } from "lucide-react";
import Notification from "./Notification";
import { useNotifications } from "@/app/context/NotificationContext";
import { useEffect } from "react";

export default function Notifications() {

  const { notifications, markAsRead, fetchAllNotifications } = useNotifications()

  useEffect(() => { fetchAllNotifications() }, [])

  return (
    <div className="bg-white p-6 rounded-md shadow border border-gray-200">
      <h2 className="text-2xl font-bold text-[#244B77] flex items-center gap-2 mb-4">
        <Bell className="w-6 h-6" />
        Njoftimet
      </h2>

      {notifications.length === 0 ? (
        <p className="text-gray-500">Nuk ka njoftime për momentin.</p>
      ) : (
        <ul className="space-y-3 overflow-y-auto max-h-[450px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          {notifications.map((notification, i) => (
            <Notification key={i} notification={notification} markAsRead={markAsRead} />
          ))}
        </ul>
      )}
    </div>
  );
}
