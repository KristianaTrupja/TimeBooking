"use client";

import { Calendar, Palmtree, Shield, LogOut } from "lucide-react";
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
      className="w-64 fixed left-0 flex flex-col py-6 z-40 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl" 
      style={{ top: "72px", height: "calc(100vh - 72px)" }}
    >
      {/* Navigation Label */}
      <div className="px-4 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</span>
      </div>

      <nav className="flex flex-col gap-2 flex-1 px-3" role="navigation" aria-label="Developer navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 text-left overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900
                ${isActive 
                  ? "bg-blue-600/20 text-blue-400 shadow-lg" 
                  : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
            >
              <Icon size={20} aria-hidden="true" className={`transition-transform duration-300 ${isActive ? "text-blue-400" : "group-hover:scale-110"}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 mt-4 pt-4 border-t border-slate-700">
        <div className="px-4 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</span>
        </div>
        {adminId && (
          <Link
            href={`/admin/?adminId=${adminId}`}
            aria-label="Go to admin dashboard"
            className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-slate-200 hover:text-amber-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <Shield size={20} aria-hidden="true" className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Go to Admin</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          aria-label="Log out of your account"
          className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left text-slate-200 hover:text-rose-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <LogOut size={20} aria-hidden="true" className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}

