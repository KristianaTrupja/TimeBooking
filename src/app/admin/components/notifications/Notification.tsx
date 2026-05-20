"use client";

import { Notification as Notif } from "@/types/notification";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { FileText, Calendar, Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type NotificationProps = {
    children?: ReactNode,
    markAsRead: (notificationId:string) => void
    notification: Notif
    onSelect: (notificationId: string) => void
    isSelected?: boolean
}

// Parse message and render **text** as bold
function renderMessageWithBold(message: string): ReactNode {
    const parts = message.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            const boldText = part.slice(2, -2);
            return <strong key={index} className="font-semibold text-slate-800">{boldText}</strong>;
        }
        return part;
    });
}

function buildActionUrl(
    baseUrl: string, 
    actionType: string | undefined, 
    senderUserId?: number,
    actionMonth?: number,
    actionYear?: number,
    actionData?: { startDate?: string }
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
        if (actionData?.startDate) {
            params.set("startDate", actionData.startDate);
        }
    } else {
        return baseUrl;
    }
    
    return `/admin?${params.toString()}`;
}

const actionConfig = {
    VIEW_TIMESHEET: { goTo: "/admin?tab=raport", icon: FileText },
    VIEW_ABSENCE: { goTo: "/admin?tab=modify-absences", icon: Calendar }
} as const;

export default function Notification({ notification, markAsRead = ()=>{}, children, onSelect = ()=>{}, isSelected = false }: NotificationProps) {
    
    const { t } = useLanguage();
    const actionType = notification.actionType as keyof typeof actionConfig;
    const action = actionType ? actionConfig[actionType] : undefined;
    const actionLabels = {
        VIEW_TIMESHEET: t.reviewInRaports,
        VIEW_ABSENCE: t.viewAbsences
    };
    const ActionIcon = action?.icon;
    const router = useRouter();

    function handleActionClick() {
        if (!action) return;
        const url = buildActionUrl(
            action.goTo, 
            notification.actionType, 
            notification.senderUserId,
            notification.actionMonth,
            notification.actionYear,
            notification.actionData
        );
        router.push(url);
    }

  return (
    <li 
      onClick={() => {
        onSelect(notification.id);
      }}
      className={`flex flex-col p-4 transition-colors cursor-pointer ${
        isSelected
          ? "bg-blue-100 ring-1 ring-blue-300"
          : notification.isRead
            ? "bg-white hover:bg-slate-50"
            : "bg-blue-50/50 hover:bg-blue-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator */}
        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notification.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-semibold text-slate-800 mb-1">
            {notification?.title || "No-Title"}
          </p>
          
          {/* Message */}
          {notification?.message && (
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              {renderMessageWithBold(notification.message)}
            </p>
          )}
          
          {children && children}
          
          {/* Action button */}
          {action && ActionIcon && actionType && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
                handleActionClick();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <ActionIcon size={12} />
              {actionLabels[actionType]}
              <ChevronRight size={12} />
            </button>
          )}
          
          {/* Timestamp */}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <Clock size={12} />
            {new Date(notification?.createdAt).toLocaleDateString("sq-AL", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour:"2-digit",
                minute:"2-digit",
            })}
          </div>
        </div>
      </div>
    </li>
  )
}


 
