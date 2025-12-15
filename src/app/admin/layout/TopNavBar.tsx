"use client"
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
  const { unreadNotificationsCount } = useNotifications()

  const handleClick = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex justify-end">
      <nav className="flex items-center gap-2">
        {topBarItems.map((item, index) => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleClick(item.tab)}
              title={item.label}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200
                ${isActive 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                  : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              {item.tab === "notifications" && unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center rounded-full text-xs text-white bg-rose-500 font-bold shadow-sm">
                  {unreadNotificationsCount}
                </span>
              )}
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

