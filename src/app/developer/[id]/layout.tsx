import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Sidebar from "../components/sidebar/Sidebar";
import { CalendarProvider } from "../../context/CalendarContext";
import { ProjectProvider } from "../../context/ProjectContext";
import { WorkHoursProvider } from "../../context/WorkHoursContext";
import SidebarHeader from "../components/sidebar/SidebarHeader";
import { HolidayProvider } from "@/app/context/HolidayContext";
import { AbsenceProvider } from "@/app/context/AbsencesContext";
import ConfirmButton from "../components/calendarActionButtons/ConfirmButton";
import SaveButton from "../components/calendarActionButtons/SaveButton";
import Link from "next/link";
import { Clock } from "lucide-react";

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const awaitedParams = await params;
  const { id } = awaitedParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  let displayedUsername = session.user?.username || "User";
  let displayedRole = session.user?.role || "developer";
  const currentUserId = String(session.user.id);
  const currentUserRole = session.user.role;

  if (id !== currentUserId) {
    const otherUser = await db.user.findUnique({
      where: { id: Number(id) },
      select: { username: true, role: true },
    });

    if (otherUser) {
      displayedUsername = otherUser.username || displayedUsername;
      displayedRole = otherUser.role || displayedRole;
    }
  }

  if (id !== currentUserId && currentUserRole?.toLowerCase() !== "admin") {
    redirect(`/developer/${currentUserId}`);
  }

  return (
      <HolidayProvider>
        <AbsenceProvider>
          <WorkHoursProvider>
            <CalendarProvider>
              <ProjectProvider>
                <div 
                  className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" 
                  style={{ fontFamily: "var(--font-anek-bangla)" }}
                >
                  {/* Fixed Header */}
                  <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 px-6 py-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <Link href={`/developer/${currentUserId}`} className="group flex items-center gap-3 hover:opacity-90 transition-all duration-300">
                        {/* Logo Icon */}
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-lg shadow-[#244B77]/25 group-hover:shadow-[#244B77]/40 transition-shadow duration-300">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full border-2 border-white" />
                        </div>
                        {/* Logo Text */}
                        <div className="flex flex-col leading-none">
                          <span 
                            className="text-xl font-bold tracking-tight text-slate-800"
                            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                          >
                            Work<span className="bg-gradient-to-r from-[#244B77] to-cyan-600 bg-clip-text text-transparent">Time</span>
                          </span>
                          <span 
                            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                          >
                            Hub
                          </span>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-slate-700 font-medium text-base tracking-wide">
                          {displayedUsername}
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                            {displayedRole?.toLowerCase() === "admin" ? "Admin" : "Developer"}
                          </span>
                        </h4>
                      </div>
                    </div>
                  </header>
                  
                  {/* Main content area with top padding for fixed header */}
                  <main className="flex-1 pt-[72px]">
                    {children}
                  </main>
                </div>
              </ProjectProvider>
            </CalendarProvider>
          </WorkHoursProvider>
        </AbsenceProvider>
      </HolidayProvider>
  );
}



