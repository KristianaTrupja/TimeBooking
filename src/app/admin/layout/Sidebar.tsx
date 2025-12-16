"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { FileText, FolderKanban, Users, CalendarPlus, CalendarCheck, Palmtree, LogOut } from "lucide-react";

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

  const currentTab = searchParams.get("tab") || "raport";

  const handleClick = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  };

  return (
    <aside 
      className="w-64 fixed left-0 flex flex-col py-6 z-40 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl"
      style={{ top: "72px", height: "calc(100vh - 72px)", fontFamily: "var(--font-anek-bangla)" }}
    >
      {/* Navigation Label */}
      <div className="px-4 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Navigation</span>
      </div>

      <nav className="flex flex-col gap-2 flex-1 px-3">
        {sidebarItems.map((item, index) => {
          const isActive = currentTab === item.tab;
          const Icon = item.icon;

          return (
            <button
              key={index}
              onClick={() => handleClick(item.tab)}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left overflow-hidden
                ${isActive 
                  ? "bg-blue-600/20 text-blue-400 shadow-lg" 
                  : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
            >
              <Icon size={20} className={`transition-transform duration-300 ${isActive ? "text-blue-400" : "group-hover:scale-110"}`} />
              <span className="font-medium">{item.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 mt-4 pt-4 border-t border-slate-700">
        <div className="px-4 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</span>
        </div>
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left text-slate-300 hover:text-rose-400 hover:bg-white/5"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
