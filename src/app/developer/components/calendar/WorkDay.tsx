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

  return (
    <>
      <div
        onClick={() => !isAbsentDay && !isDisabled && setIsModalOpen(true)}
        onMouseEnter={() => {
          setHoveredColIndex(colIndex);
          setHoveredProjectKey(projectKey);
        }}
        onMouseLeave={() => {
          setHoveredColIndex(null);
          setHoveredProjectKey(null);
        }}
        title={title ?? undefined}
        className={`relative w-9 h-9 2xl:w-10 2xl:h-10 flex items-center justify-center text-sm border-r border-b border-gray-300
          ${isHoliday ? "bg-green-100" : isDisabled ? "bg-slate-100 text-slate-400 font-bold !border-gray-200" : isAbsentDay ? "bg-orange-100 cursor-default" : isWeekendDay ? "bg-gray-100" : "bg-white hover:bg-gray-100 cursor-pointer"}
          ${isHovered && !isDisabled && !isWeekendDay && !isHoliday && !isAbsentDay && "!bg-[#f1f7fde7]"}
          ${isPending ? " font-bold text-blue-900 border-blue-400" : ""}
        `}
      >
        {displayData.hours ? Number(displayData.hours).toFixed(2) : ""}
        {displayData.note && (
          <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[10px] border-l-[10px] border-b-green-500 border-l-transparent" />
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
