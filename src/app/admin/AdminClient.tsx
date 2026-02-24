"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Raport from "./components/raport/Raport";
import Companies from "./components/companies/Companies";
import Projects from "./components/projects/Projects";
import Users from "./components/users/Users";
import Absences from "./components/absences/Absences";
import Vacations from "./components/vacations/Vacations";
import ModifyAbsences from "./components/modify-absences/ModifyAbsences";
import { WorkHoursProvider } from "@/app/context/WorkHoursContext";
import { CalendarProvider } from "@/app/context/CalendarContext";
import { ProjectProvider } from "@/app/context/ProjectContext";
import Notifications from "./components/notifications/Notifications";
import Settings from "./components/settings/Settings";

export default function AdminClient() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("raport");
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const calculateHeight = useCallback(() => {
    if (sectionRef.current) {
      const sectionTop = sectionRef.current.getBoundingClientRect().top;
      const availableHeight = window.innerHeight - sectionTop;
      setContainerHeight(Math.max(availableHeight, 200));
    }
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") || "raport";
    setTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight]);

  return (
    <section
      ref={sectionRef}
      className="p-0 sm:p-6"
      style={{
        fontFamily: "var(--font-anek-bangla)",
        height: containerHeight ? `${containerHeight}px` : "66vh",
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
        {tab === "raport" && (
            <CalendarProvider>
              <ProjectProvider>
                <WorkHoursProvider>
                  <Raport />
                </WorkHoursProvider>
              </ProjectProvider>
            </CalendarProvider>
        )}
        {tab === "companies" && <Companies />}
        {tab === "projects" && <Projects />}
        {tab === "users" && <Users />}
        {tab === "absences" && <Absences />}
        {tab === "modify-absences" && <ModifyAbsences />}
        {tab === "holidays" && <Vacations />}
        {tab === "notifications" && <Notifications/>}
        {tab === "settings" && <Settings />}
      </div>
    </section>
  );
}
