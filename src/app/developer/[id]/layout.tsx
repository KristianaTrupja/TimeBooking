import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Sidebar from "../components/sidebar/Sidebar";
import { CalendarProvider } from "../../context/CalendarContext";
import { ProjectProvider } from "../../context/ProjectContext";
import { WorkHoursProvider } from "../../context/WorkHoursContext";
import SidebarHeader from "../components/sidebar/SidebarHeader";
import SignOutButton from "../components/signoutbutton/SignOutButton";
import { HolidayProvider } from "@/app/context/HolidayContext";
import { AbsenceProvider } from "@/app/context/AbsencesContext";
import AdminBackButton from "@/app/components/AdminBackButton";
import ConfirmButton from "../components/calendarActionButtons/ConfirmButton";
import SaveButton from "../components/calendarActionButtons/SaveButton";

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
              <section
                className="transition-opacity duration-300 2xl:mx-50 pt-11 min-h-screen w-auto 2xl:container"
                style={{ fontFamily: "var(--font-anek-bangla)" }}
              >
                <div className="flex justify-between mb-6 items-center">
                  <h2
                    className="text-4xl sm:text-6xl text-[#244B77] text-center"
                    style={{ fontFamily: "var(--font-keania-one)" }}
                  >
                    ClockIn
                  </h2>
                  <div className="user-name flex items-center pr-5 2xl:pr-0">
                    <h4 className="text-[#116B16] font-semibold text-xl mr-10">
                      {displayedUsername} (
                      {displayedRole?.toLowerCase() === "admin"
                        ? "Admin"
                        : "Developer"}
                      )
                    </h4>
                    <AdminBackButton />
                    <SignOutButton />
                  </div>
                </div>
                <SidebarHeader />
                <main className="2xl:w-fit flex">
                  <Sidebar />
                  {children}
                </main>
                <div className="flex justify-end items-center gap-4 p-4 mt-5">
                  <ConfirmButton />
                  <SaveButton />
                </div>
              </section>
            </ProjectProvider>
          </CalendarProvider>
        </WorkHoursProvider>
      </AbsenceProvider>
    </HolidayProvider>
  );
}