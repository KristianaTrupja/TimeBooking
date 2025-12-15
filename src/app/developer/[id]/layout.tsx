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
                <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-anek-bangla)" }}>
                  {/* Fixed Header */}
                  <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <h2
                        className="text-3xl sm:text-5xl text-[#244B77]"
                        style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: "300", letterSpacing: "-2px" }}
                      >
                        <Link href={`/developer/${currentUserId}`}>
                          WorkTime Hub
                        </Link>
                      </h2>
                      <div className="flex items-center">
                        <h4 className="text-[#116B16] font-semibold text-lg">
                          {displayedUsername} ({displayedRole?.toLowerCase() === "admin" ? "Admin" : "Developer"})
                        </h4>
                      </div>
                    </div>
                  </header>
                  
                  {/* Main content area with top padding for fixed header */}
                  <main className="flex-1 pt-[76px]">
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



