"use client";

import { Bell } from "lucide-react";
import Notification from "./Notification";
import { useNotifications } from "@/app/context/NotificationContext";
import { useEffect, useRef, useState, useCallback } from "react";

export default function Notifications() {
  const { notifications, markAsRead, fetchAllNotifications } = useNotifications()
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLHeadingElement>(null);

  const calculateHeight = useCallback(() => {
    if (containerRef.current && headerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const headerStyles = window.getComputedStyle(headerRef.current);
      const headerHeight = headerRef.current.offsetHeight + 
        parseFloat(headerStyles.marginTop) + parseFloat(headerStyles.marginBottom);
      const padding = 48; // Account for container padding
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
    <div ref={containerRef} className="bg-white p-6 rounded-md shadow border border-gray-200">
      <h2 ref={headerRef} className="text-2xl font-bold text-[#244B77] flex items-center gap-2 mb-4">
        <Bell className="w-6 h-6" />
        Notifications
      </h2>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications</p>
      ) : (
        <ul
          className="space-y-3 overflow-y-auto shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]"
          style={{ maxHeight: containerHeight ? `${containerHeight}px` : "450px" }}
        >
          {notifications.map((notification, i) => (
            <Notification key={i} notification={notification} markAsRead={markAsRead} />
          ))}
        </ul>
      )}
    </div>
  );
}
