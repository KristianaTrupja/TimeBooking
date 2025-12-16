"use client"
import { useCallback } from "react";
import { Bell, Settings } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotifications } from "@/app/context/NotificationContext";

const topBarItems = [
  { icon: Bell, label: "Notifications", tab: "notifications" },
  { icon: Settings, label: "Settings", tab: "settings" }
];

export default function TopNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "raport";
  const { unreadNotificationsCount } = useNotifications();

  const handleClick = useCallback((tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  }, [router, pathname]);

  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-6 py-3 flex justify-end sticky top-0 z-40">
      <nav className="flex items-center gap-3" role="navigation" aria-label="Top navigation">
        {topBarItems.map((item, index) => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleClick(item.tab)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300
                ${isActive 
                  ? "bg-gradient-to-r from-[#244B77] to-[#1a3a5c] text-white shadow-lg shadow-[#244B77]/25" 
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                }
                focus:outline-none focus:ring-2 focus:ring-[#244B77]/50 focus:ring-offset-2`}
            >
              {item.tab === "notifications" && unreadNotificationsCount > 0 && (
                <span 
                  className="absolute -top-1.5 -left-1.5 min-w-[22px] h-[22px] flex items-center justify-center rounded-full text-[11px] text-white bg-gradient-to-r from-rose-500 to-pink-500 font-bold shadow-md shadow-rose-500/30 ring-2 ring-white animate-pulse px-1"
                  aria-label={`${unreadNotificationsCount} unread notifications`}
                >
                  {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                </span>
              )}
              <Icon size={18} aria-hidden="true" className={isActive ? "text-white" : ""} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}

