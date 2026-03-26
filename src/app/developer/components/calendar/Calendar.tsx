"use client";
import React, { useCallback, useEffect, useState } from "react";
import TopBar from "./TopBar";
import WorkDay from "./WorkDay";
import { useCalendar } from "@/app/context/CalendarContext";
import { getDaysInMonth } from "@/app/utils/dateUtils";
import { useProjects } from "@/app/context/ProjectContext";
import { Project } from "@/types/project";
import { usePathname } from "next/navigation";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { getDayData } from "@/app/hooks/getDayData";
import { normalizeProjectKey } from "@/app/utils/normalizeProjectKey";
import { User } from "next-auth";

function formatDate(year: number, month: number, day: string) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function Calendar({ isOwner=false }: { isOwner:boolean }) {
  const { year, month } = useCalendar();
  const { workHours, metadata } = useWorkHours()
  const { sidebarProjects } = useProjects();
  
  const pathname = usePathname();
  const userId = pathname.split("/")[2];
  const daysArray = getDaysInMonth(year, month);

  const [hoveredColIndex, setHoveredColIndex] = useState<number | null>(null);
  const [hoveredProjectKey, setHoveredProjectKey] = useState<string | null>(null);


  return (
    <div className="overflow-hidden shadow-sm border border-slate-200">
      <TopBar hoveredColIndex={hoveredColIndex} />
      <div className="flex flex-col bg-slate-50">
        {sidebarProjects.map((companyBlock) => (
          <React.Fragment key={companyBlock.company}>
            {/* Company label row */}
            <div className="flex items-center h-9 2xl:h-10 px-2 font-semibold bg-slate-100 border-b border-slate-200" />
            {/* Project rows */}
            {companyBlock.projects.map((proj: Project) => {
              const isProjectInactive = !proj.isActive;
              return (
              <div className="flex" key={proj.projectKey}>
                {daysArray.map((day,dayIndex) => {
                  const date = formatDate(year, month, day);
                  const normalizedKey = normalizeProjectKey(proj.projectKey);
                  const dayData = getDayData(workHours, date, userId, normalizedKey)
                  return (
                    <WorkDay
                      dayData={dayData}
                      isDisabled={!isOwner || metadata?.isLocked || isProjectInactive}
                      isProjectInactive={isProjectInactive}
                      key={`${proj.projectKey}-${day}`}
                      date={date}
                      projectKey={proj.projectKey}
                      userId={userId}
                      colIndex={dayIndex}
                      hoveredColIndex={hoveredColIndex}
                      hoveredProjectKey={hoveredProjectKey}
                      setHoveredColIndex={setHoveredColIndex}
                      setHoveredProjectKey={setHoveredProjectKey}
                    />
                  );
                })}
              </div>
            )})}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
