"use client"
import { Bell, Settings } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/app/context/NotificationContext";

const topBarItems = [
  { icon: <Bell className="w-6 h-6" />, tab: "notifications" },
  { icon: <Settings className="w-6 h-6" />, tab: "settings" }
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
    <header className="w-full bg-[#244B77] shadow-sm px-2 py-2 flex justify-end">
      <nav className="flex items-center gap-2">
        {topBarItems.map((item, index) => {
          const isActive = currentTab === item.tab;
          return (
            <button
              key={index}
              onClick={() => handleClick(item.tab)}
              title={item.tab}
              className={cn(
                "relative rounded-md p-1 px-2 transition text-[#244B77] bg-white flex gap-1 font-bold capitalize",
                isActive && item.tab === "notifications" && "bg-[#6C99CB] text-white",
                isActive && item.tab === "settings" && "bg-[#6C99CB] text-white"
              )}
            >
              {item.tab === "notifications" &&
              unreadNotificationsCount > 0 &&
              <span className="UnreadNotificationCount inline-block px-1 rounded-full text-sm text-white top-[-7px] left-[-7px] absolute bg-red-500">{unreadNotificationsCount}</span>}
              {item.icon}
              {item.tab}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

