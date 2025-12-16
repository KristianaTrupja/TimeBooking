"use client";

import { Bell, Inbox } from "lucide-react";
import Notification from "./Notification";
import { useNotifications } from "@/app/context/NotificationContext";
import { useEffect, useRef, useState, useCallback } from "react";

export default function Notifications() {
  const { notifications, markAsRead, fetchAllNotifications } = useNotifications()
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const calculateHeight = useCallback(() => {
    if (containerRef.current && headerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const headerStyles = window.getComputedStyle(headerRef.current);
      const headerHeight = headerRef.current.offsetHeight + 
        parseFloat(headerStyles.marginTop) + parseFloat(headerStyles.marginBottom);
      const padding = 48;
      const availableHeight = window.innerHeight - containerTop - headerHeight - padding;
      setContainerHeight(Math.max(availableHeight, 200));
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight]);

  useEffect(() => { fetchAllNotifications() }, [])

  return (
    <div ref={containerRef} className="p-6 h-full">
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-700 text-white">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Notifications</h2>
            <p className="text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
        {notifications.length > 0 && (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
            {notifications.length} total
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox size={48} className="text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-500">No notifications</p>
            <p className="text-sm text-slate-400">You&apos;re all caught up!</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <ul
            className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: containerHeight ? `${containerHeight}px` : "450px" }}
          >
            {notifications.map((notification, i) => (
              <Notification key={i} notification={notification} markAsRead={markAsRead} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
