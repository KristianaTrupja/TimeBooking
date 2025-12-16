"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { FileText, FolderKanban, Users, CalendarPlus, CalendarCheck, Palmtree, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/app/context/SidebarContext";

const sidebarItems = [
  { title: "Timesheets", tab: "raport", icon: FileText },
  { title: "Projects", tab: "projects", icon: FolderKanban },
  { title: "Employees", tab: "users", icon: Users },
  { title: "Grant Leave", tab: "absences", icon: CalendarPlus },
  { title: "View Leaves", tab: "modify-absences", icon: CalendarCheck },
  { title: "Official Holidays", tab: "holidays", icon: Palmtree }
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const currentTab = searchParams.get("tab") || "raport";

  const handleClick = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  };

  return (
    <aside 
      className={`fixed left-0 flex flex-col py-6 z-40 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl transition-all duration-300 ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
      style={{ top: "72px", height: "calc(100vh - 72px)", fontFamily: "var(--font-anek-bangla)" }}
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
      <div className={`px-4 mb-4 ${isCollapsed ? "hidden" : ""}`}>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Navigation</span>
      </div>

      <nav className={`flex flex-col gap-2 flex-1 ${isCollapsed ? "px-2" : "px-3"}`} role="navigation" aria-label="Admin navigation">
        {sidebarItems.map((item, index) => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;

          return (
            <button
              key={index}
              onClick={() => handleClick(item.tab)}
              aria-current={isActive ? "page" : undefined}
              title={isCollapsed ? item.title : undefined}
              className={`group relative flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 ${isCollapsed ? "px-0 py-3" : "px-4 py-3"} rounded-lg transition-all duration-300 text-left overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900
                ${isActive 
                  ? "bg-blue-600/20 text-blue-400 shadow-lg" 
                  : "text-slate-200 hover:text-white hover:bg-white/10"
                }`}
            >
              <Icon size={20} aria-hidden="true" className={`flex-shrink-0 transition-transform duration-300 ${isActive ? "text-blue-400" : "group-hover:scale-110"}`} />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.title}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`mt-4 pt-4 border-t border-slate-700 ${isCollapsed ? "px-2" : "px-3"}`}>
        {!isCollapsed && (
          <div className="px-4 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          aria-label="Log out of your account"
          title={isCollapsed ? "Log Out" : undefined}
          className={`group w-full flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 ${isCollapsed ? "px-0 py-3" : "px-4 py-3"} rounded-xl transition-all duration-300 text-left text-slate-200 hover:text-rose-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900`}
        >
          <LogOut size={20} aria-hidden="true" className="flex-shrink-0 group-hover:scale-110 transition-transform" />
          {!isCollapsed && <span className="font-medium">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
