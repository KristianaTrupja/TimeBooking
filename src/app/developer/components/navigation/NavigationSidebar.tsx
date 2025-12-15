"use client";

import { Calendar, Palmtree } from "lucide-react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Tab = "time-reporting" | "vacations";

interface NavigationSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function NavigationSidebar({ activeTab, onTabChange }: NavigationSidebarProps) {
  const searchParams = useSearchParams();
  const adminId = searchParams.get("adminId");

  const menuItems = [
    { id: "time-reporting" as Tab, label: "Time Reporting", icon: Calendar },
    { id: "vacations" as Tab, label: "Vacations", icon: Palmtree },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  };

  return (
    <aside 
      className="w-64 bg-[#244B77] fixed left-0 flex flex-col py-4 rounded-r-lg z-40" 
      style={{ top: "76px", height: "calc(100vh - 76px)" }}
    >
      <nav className="flex flex-col gap-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 text-left
                ${isActive 
                  ? "bg-white/20 text-white font-semibold" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 mt-4 border-t border-white/20 pt-4">
        {adminId && (
          <Link
            href={`/admin/?adminId=${adminId}`}
            className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 text-white/70 hover:bg-white/10 hover:text-white"
          >
            Go to Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 text-left text-white/70 hover:bg-white/10 hover:text-white"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}

