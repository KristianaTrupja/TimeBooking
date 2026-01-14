"use client";

import { useState } from "react";
import { useCalendar } from "@/app/context/CalendarContext";
import { isWeekend } from "@/app/utils/dateUtils";
import { WorkHoursModal } from "@/app/components/WorkHoursModal";
import { DayBoxProps } from "@/types/workDay";
import { useDayHoliday } from "@/app/hooks/useDayHoliday";
import { useAbsenceContext } from "@/app/context/AbsencesContext";
import { useIsAbsentDay } from "@/app/hooks/useIsAbsentDay";
import { useHolidayContext } from "@/app/context/HolidayContext";

export default function WorkDay({
  dayData,
  isDisabled,
  isProjectInactive = false,
  date,
  projectKey,
  userId,
  colIndex,
  hoveredColIndex,
  hoveredProjectKey,
  setHoveredColIndex,
  setHoveredProjectKey,
}: DayBoxProps) {
  const { year, month, refreshPendingStatus } = useCalendar();
  const [holidays, loading] = useHolidayContext();
  const [absences, absenceLoading] = useAbsenceContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const day = parseInt(date.split("-")[2], 10);
  const isWeekendDay = isWeekend(year, month, day);
  const { isHoliday, holidayTitle } = useDayHoliday(year, month, day, holidays);
  const { isAbsentDay, absenceType } = useIsAbsentDay(absences, date);

  // Load from sessionStorage
  const localKey = `workhours_${userId}_${projectKey}_${date}`;
  const localDataRaw = typeof window !== "undefined" ? sessionStorage.getItem(localKey) : null;
  const localData = localDataRaw ? JSON.parse(localDataRaw) : null; // [••2••]

  const isPending = !!localData;
  const displayData = localData ?? dayData; // [••1••]

  if (loading || absenceLoading) return null;

  const handleSave = async (hours: number, note: string) => {
    const data = { hours, note };
    sessionStorage.setItem(localKey, JSON.stringify(data));
    refreshPendingStatus();
    setIsModalOpen(false);
  };

  const title = isAbsentDay
    ? absenceType
    : isHoliday
    ? holidayTitle
    : undefined;

  const isHovered = hoveredColIndex === colIndex || hoveredProjectKey === projectKey;

  // Determine background and text colors based on day type (priority order)
  const getDayStyles = () => {
    // Inactive project styling - override all other styles
    if (isProjectInactive) {
      return "bg-slate-300/50 text-slate-400 cursor-not-allowed";
    }
    if (isHoliday) {
      return "bg-emerald-100 text-emerald-700";
    }
    if (isAbsentDay) {
      return "bg-amber-100 text-amber-700";
    }
    if (isWeekendDay) {
      return "bg-slate-100/70 text-slate-500";
    }
    // Normal day
    if (isDisabled) {
      return "bg-slate-100 text-slate-500";
    }
    return "bg-white hover:bg-blue-200 cursor-pointer text-slate-700";
  };

  const canClick = !isAbsentDay && !isDisabled && !isHoliday && !isWeekendDay && !isProjectInactive;

  return (
    <>
      <div
        onClick={() => canClick && setIsModalOpen(true)}
        onMouseEnter={() => {
          setHoveredColIndex(colIndex);
          setHoveredProjectKey(projectKey);
        }}
        onMouseLeave={() => {
          setHoveredColIndex(null);
          setHoveredProjectKey(null);
        }}
        title={title ?? displayData.note}
        className={`relative w-9 h-9 2xl:w-10 2xl:h-10 flex items-center justify-center text-sm border-r border-b border-slate-200 transition-all duration-150
          ${getDayStyles()}
          ${!canClick ? "cursor-default" : ""}
          ${isHovered && canClick && "!bg-blue-100"}
          ${isPending && !isProjectInactive ? "font-semibold !text-blue-600 !bg-blue-100 ring-1 ring-inset ring-blue-200" : ""}
          ${isProjectInactive ? "opacity-60" : ""}
        `}

         
      >
        {displayData.hours ? Number(displayData.hours).toFixed(2) : ""}
        {displayData.note && (
          <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[8px] border-l-[8px] border-b-emerald-500 border-l-transparent" />
        )}
      </div>

      <WorkHoursModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialHours={displayData.hours?.toString() ?? ""}
        initialNote={displayData.note ?? ""}
      />
    </>
  );
}
     