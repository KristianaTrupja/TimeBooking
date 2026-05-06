"use client";

import { Bell, Inbox, Trash2 } from "lucide-react";
import Notification from "./Notification";
import { useNotifications } from "@/app/context/NotificationContext";
import { useEffect, useRef, useState, useCallback } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { toast } from "sonner";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const { notifications, markAsRead, fetchAllNotifications, deleteSelectedNotifications, markAllAsRead } = useNotifications()
  const { t } = useLanguage();
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const notificationsContainerRef = useRef<HTMLDivElement>(null);
  const isMobileLayout = useIsMobile(1024);

  const unreadCount = notifications?.filter(n => !n.isRead).length;
  const [selectedNotificationsIds, setSelectedNotificationsIds] = useState<string[]>([]);

  const handleDeleteSelected = () => {
    if (selectedNotificationsIds.length === 0) {
      toast.info("Select at least one notification");
      return;
    }
    setShowDeleteSelectedModal(true);
  };

  const handleReadAllNotifications = async () => {
    try {
      const updatedCount = await markAllAsRead();
      toast.success(`Marked ${updatedCount} notification(s) as read`);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const confirmDeleteSelected = async () => {
    setIsDeletingSelected(true);
    try {
      const deletedCount = await deleteSelectedNotifications(selectedNotificationsIds);
      setSelectedNotificationsIds([]);
      setShowDeleteSelectedModal(false);
      toast.success(`Deleted ${deletedCount} selected notification(s)`);
      console.log("deleted", selectedNotificationsIds);
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const calculateHeight = useCallback(() => {
    if (containerRef.current && headerRef.current) {
      if (window.innerWidth >= 1024) {
        const containerTop = containerRef.current.getBoundingClientRect().top;
        const headerStyles = window.getComputedStyle(headerRef.current);
        const headerHeight = headerRef.current.offsetHeight +
          parseFloat(headerStyles.marginTop) + parseFloat(headerStyles.marginBottom);
        const padding = 48;
        const availableHeight = window.innerHeight - containerTop - headerHeight - padding;
        setContainerHeight(Math.max(availableHeight, 200));
      } else {
        setContainerHeight(null);
      }
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight]);

  useEffect(() => { fetchAllNotifications() }, [])


  const handleNotificationSelect = (notificationId: string) => {
    setSelectedNotificationsIds((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  useEffect(() => {
    const ids = new Set(notifications.map((n) => n.id));
    setSelectedNotificationsIds((prev) => prev.filter((id) => ids.has(id)));
  }, [notifications]);

  useEffect(() => {
    // const handleDocumentClick = (event: MouseEvent) => {
    //   if (showDeleteSelectedModal) return;
    //   const container = notificationsContainerRef.current;
    //   if (!container) return;
    //   if (container.contains(event.target as Node) || (event.target as HTMLElement)?.tagName === "BUTTON") {
    //     console.log("clicked inside", (event.target as HTMLElement)?.tagName);
    //   } else {
    //     console.log("clicked outside", (event.target as HTMLElement)?.tagName);
    //     setSelectedNotificationsIds((prev) => (prev.length > 0 ? [] : prev));
    //   }
    // };

    // document.addEventListener("mousedown", handleDocumentClick);
    // return () => document.removeEventListener("mousedown", handleDocumentClick);
 
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedNotificationsIds((prev) => (prev.length > 0 ? [] : prev));
      }
    };
    document.addEventListener("keyup", handleEscapeKey);
    return () => document.removeEventListener("keyup", handleEscapeKey);

  }, [showDeleteSelectedModal]);

  return (
    <div ref={containerRef} className="p-6 h-full">
      <div
        ref={headerRef}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-700 text-white">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {t.notifications}
            </h2>
            <p className="text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} ${t.unread}` : t.allCaughtUp}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedNotificationsIds.length > 0 && (
            <>
              <span className="px-3 py-1 text-slate-600 text-sm font-medium">
                {selectedNotificationsIds.length} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                title="Delete selected notifications"
              >
                <Trash2 size={14} />
                {t.delete}
              </button>
            </>
          )}

          {notifications?.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
              {notifications.length} {t.total.toLowerCase()}
            </span>
          )}

          <Button
            variant="link"
            onClick={handleReadAllNotifications}
            disabled={isDeletingSelected}
            className="text-primary hover:text-blue-500 text-sm font-medium p-1 underline"
          >
            {t.markAllAsRead}
          </Button>
        </div>
      </div>

      {notifications?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox size={48} className="text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-500">
              {t.noNotifications}
            </p>
            <p className="text-sm text-slate-400">{t.youreAllCaughtUp}</p>
          </div>
        </div>
      ) : (
        <div
          ref={notificationsContainerRef}
          className="notifications-container bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <ul
            className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar"
            style={{
              maxHeight: !isMobileLayout
                ? containerHeight
                  ? `${containerHeight}px`
                  : "450px"
                : undefined,
            }}
          >
            {notifications?.map((notification) => {
              const isSelected = selectedNotificationsIds.includes(
                notification.id,
              );
              return (
                <Notification
                  key={notification.id}
                  notification={notification}
                  markAsRead={markAsRead}
                  onSelect={handleNotificationSelect}
                  isSelected={isSelected}
                />
              );
            })}
          </ul>
        </div>
      )}

      <Modal
        isOpen={showDeleteSelectedModal}
        onClose={() => {
          if (isDeletingSelected) return;
          setShowDeleteSelectedModal(false);
        }}
        title="Delete Selected Notifications"
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteSelectedModal(false)}
              disabled={isDeletingSelected}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={confirmDeleteSelected}
              loading={isDeletingSelected}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              {t.delete}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          {`Are you sure you want to delete ${selectedNotificationsIds.length} selected notification(s)?`}
        </p>
      </Modal>
    </div>
  );
}
