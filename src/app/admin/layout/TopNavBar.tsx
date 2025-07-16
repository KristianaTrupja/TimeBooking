"use client"
import { Button } from "@/components/ui/button";
import { Bell, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const topBarItems = [
  { icon: <Bell className="w-6 h-6" />, tab: "notifications" },
  { icon: <Settings className="w-6 h-6" />, tab: "settings" }
];

export default function TopNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "raport";

  const onSignout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  };

  const handleClick = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  };

  return (
    <header className="w-full bg-[#759D7F] shadow-sm px-2 py-1 flex justify-end">
      <nav className="flex items-center gap-3">
        {topBarItems.map((item, index) => {
          const isActive = currentTab === item.tab;
          return (
            <button
              key={index}
              onClick={() => handleClick(item.tab)}
              className={cn(
                "p-2 rounded-full transition",
                item.tab === "notifications" && "bg-white text-[#CA0505] hover:bg-[#CA0505] hover:text-[#ffffff]",
                item.tab === "settings" &&
                "border-2 border-[#393B3E] bg-[#B1B1B1] text-[#393B3E] hover:bg-[#393B3E] hover:text-white",
                isActive && item.tab === "notifications" && "bg-[#CA0505] text-white",
                isActive && item.tab === "settings" && "bg-[#393B3E] text-white"
              )}
            >
              {item.icon}
            </button>
          );
        })}
        <Button variant="secondary" size="sm" onClick={onSignout}><LogOut /></Button>
      </nav>
    </header>
  );
}

