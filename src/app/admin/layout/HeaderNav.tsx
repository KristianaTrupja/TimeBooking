"use client"
import { useCallback } from "react";
import { Bell, Settings } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useNotifications } from "@/app/context/NotificationContext";
import { useLanguage } from "@/app/context/LanguageContext";
import HeaderLanguageSwitcher from "@/components/ui/HeaderLanguageSwitcher";

export default function HeaderNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "raport";
  const { unreadNotificationsCount } = useNotifications();
  const { t } = useLanguage();

  const navItems = [
    { icon: Bell, label: t.notifications || "Notifications", tab: "notifications" },
    { icon: Settings, label: t.settings, tab: "settings" }
  ];

  const handleClick = useCallback((tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  }, [router, pathname]);

  return (
    <nav className="flex items-center gap-2 sm:gap-3" role="navigation" aria-label="Quick actions">
      <HeaderLanguageSwitcher />
      <div className="hidden sm:block h-6 w-px bg-slate-200" />
      {navItems.map((item) => {
        const isActive = currentTab === item.tab;
        const Icon = item.icon;
        return (
          <button
            key={item.tab}
            onClick={() => handleClick(item.tab)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-300
              ${isActive 
                ? "bg-gradient-to-r from-[#244B77] to-[#1a3a5c] text-white shadow-lg shadow-[#244B77]/25" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }
              focus:outline-none focus:ring-2 focus:ring-[#244B77]/50 focus:ring-offset-2`}
          >
            {item.tab === "notifications" && unreadNotificationsCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] flex items-center justify-center rounded-full text-[9px] sm:text-[10px] text-white bg-gradient-to-r from-rose-500 to-pink-500 font-bold shadow-md shadow-rose-500/30 ring-2 ring-white px-1"
                aria-label={`${unreadNotificationsCount} unread notifications`}
              >
                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
              </span>
            )}
            <Icon size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}