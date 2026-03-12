import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CalendarProvider } from "../../context/CalendarContext";
import { ProjectProvider } from "../../context/ProjectContext";
import { WorkHoursProvider } from "../../context/WorkHoursContext";
import { HolidayProvider } from "@/app/context/HolidayContext";
import { AbsenceProvider } from "@/app/context/AbsencesContext";
import { SidebarProvider } from "@/app/context/SidebarContext";
import Link from "next/link";
import { Clock } from "lucide-react";
import DeveloperHeaderActions from "../components/header/DeveloperHeaderActions";

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
  const currentUserId = String(session.user.id);

  const currentDbUser = await db.user.findUnique({
    where: { id: Number(currentUserId) },
    select: { username: true, role: true, isActive: true },
  });

  if (!currentDbUser || !currentDbUser.isActive) {
    redirect("/login");
  }

  let displayedUsername = currentDbUser.username || "User";
  let displayedRole = currentDbUser.role || "developer";
  const currentUserRole = currentDbUser.role;

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
    <SidebarProvider>
      <HolidayProvider userId={Number(id)}>
        <AbsenceProvider>
          <WorkHoursProvider>
            <CalendarProvider>
              <ProjectProvider>
                <div 
                  className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" 
                  style={{ fontFamily: "var(--font-anek-bangla)" }}
                >
                  {/* Skip Navigation Link */}
                  <a 
                    href="#main-content" 
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
                  >
                    Skip to main content
                  </a>
                  
                  {/* Fixed Header */}
                  <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 shadow-sm" role="banner">
                    <div className="flex justify-between items-center">
                      <Link href={`/developer/${currentUserId}`} className="group flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-all duration-300">
                        {/* Logo Icon */}
                        <div className="relative">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-lg shadow-[#244B77]/25 group-hover:shadow-[#244B77]/40 transition-shadow duration-300">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full border-2 border-white" />
                        </div>
                        {/* Logo Text */}
                        <div className="flex flex-col leading-none">
                          <span 
                            className="text-lg sm:text-xl font-bold tracking-tight text-slate-800"
                            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                          >
                            Work<span className="bg-gradient-to-r from-[#244B77] to-cyan-600 bg-clip-text text-transparent">Time</span>
                          </span>
                          <span 
                            className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                          >
                            Hub
                          </span>
                        </div>
                      </Link>
                      <DeveloperHeaderActions 
                        displayedUsername={displayedUsername} 
                        displayedRole={displayedRole} 
                      />
                    </div>
                  </header>
                  
                  {/* Main content area with top padding for fixed header */}
                  <main id="main-content" className="flex-1 pt-[72px]" role="main">
                    {children}
                  </main>
                </div>
              </ProjectProvider>
            </CalendarProvider>
          </WorkHoursProvider>
        </AbsenceProvider>
      </HolidayProvider>
    </SidebarProvider>
  );
}



