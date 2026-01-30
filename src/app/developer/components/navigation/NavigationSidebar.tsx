"use client";

import { Calendar, Palmtree, CalendarDays, Shield, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSidebar } from "@/app/context/SidebarContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { useEffect, useMemo, useState } from "react";

type Tab = "time-reporting" | "vacations" | "holidays";

interface NavigationSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function NavigationSidebar({ activeTab, onTabChange }: NavigationSidebarProps) {
  const searchParams = useSearchParams();
  const adminId = searchParams.get("adminId");
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { t } = useLanguage();
  const [dbRole, setDbRole] = useState<string | null>(null);

  // If the user was promoted to Admin, don't wait for JWT refresh.
  // Fetch role from DB so UI updates immediately.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setDbRole(data?.role ?? null);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canGoToAdmin = useMemo(() => {
    return Boolean(adminId) || dbRole?.toLowerCase() === "admin";
  }, [adminId, dbRole]);

  const menuItems = [
    { id: "time-reporting" as Tab, label: t.timeReporting, icon: Calendar },
    { id: "vacations" as Tab, label: t.vacations, icon: Palmtree },
    { id: "holidays" as Tab, label: t.holidays, icon: CalendarDays },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  };

  return (
    <aside 
      className={`fixed left-0 flex flex-col py-6 z-40 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl transition-all duration-300 ${
        isCollapsed ? "w-[72px]" : "w-52 2xl:w-64"
      }`}
      style={{ top: "72px", height: "calc(100vh - 72px)" }}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 transition-all z-50"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight size={14} className="text-white" />
        ) : (
          <ChevronLeft size={14} className="text-white" />
        )}
      </button>

      {/* Navigation Label */}
      {!isCollapsed && (
        <div className="px-4 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.navigation}</span>
        </div>
      )}

      <nav className={`flex flex-col gap-2 flex-1 ${isCollapsed ? "px-2 mt-4" : "px-3"}`} role="navigation" aria-label="Developer navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              title={isCollapsed ? item.label : undefined}
              className={`group relative flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 ${isCollapsed ? "px-0 py-3" : "px-4 py-2"} rounded-lg transition-all duration-300 text-left overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900
                ${isActive 
                  ? "bg-blue-600/20 text-blue-400 shadow-lg" 
                  : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
            >
              <Icon size={20} aria-hidden="true" className={`flex-shrink-0 transition-transform duration-300 ${isActive ? "text-blue-400" : "group-hover:scale-110"}`} />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`mt-4 pt-4 border-t border-slate-700 ${isCollapsed ? "px-2" : "px-3"}`}>
        {!isCollapsed && (
          <div className="px-4 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t.actions}</span>
          </div>
        )}
        {canGoToAdmin && (
          <Link
            href={adminId ? `/admin/?adminId=${adminId}` : "/admin"}
            aria-label="Go to admin dashboard"
            title={isCollapsed ? t.goToAdmin : undefined}
            className={`group flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 ${isCollapsed ? "px-0 py-3" : "px-4 py-3"} rounded-xl transition-all duration-300 text-slate-200 hover:text-amber-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900`}
          >
            <Shield size={20} aria-hidden="true" className="flex-shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="font-medium">{t.goToAdmin}</span>}
          </Link>
        )}
        <button
          onClick={handleLogout}
          aria-label="Log out of your account"
          title={isCollapsed ? t.signOut : undefined}
          className={`group w-full flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 ${isCollapsed ? "px-0 py-3" : "px-4 py-3"} rounded-xl transition-all duration-300 text-left text-slate-200 hover:text-rose-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900`}
        >
          <LogOut size={20} aria-hidden="true" className="flex-shrink-0 group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span className="font-medium">{t.signOut}</span>}
        </button>
      </div>
    </aside>
  );
}
