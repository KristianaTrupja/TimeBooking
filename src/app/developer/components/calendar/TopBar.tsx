"use client";

import { useEffect, useState, useMemo } from "react";
import { useCalendar } from "@/app/context/CalendarContext";
import { getDaysInMonth, isWeekend } from "@/app/utils/dateUtils";
import { useDayHoliday } from "@/app/hooks/useDayHoliday";
import { useIsAbsentDay } from "@/app/hooks/useIsAbsentDay";
import { useAbsenceContext } from "@/app/context/AbsencesContext";
import { useHolidayContext } from "@/app/context/HolidayContext";

export default function TopBar({ hoveredColIndex }: { hoveredColIndex: number | null }) {
  const [holidays, loading] = useHolidayContext();
  const [absences, absenceLoading] = useAbsenceContext();
  const { month, year } = useCalendar();
  const [days, setDays] = useState<string[]>([]);

  const today = useMemo(() => new Date(), []);
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  useEffect(() => {
    setDays(getDaysInMonth(year, month));
  }, [month, year]);

  if (absenceLoading || loading) return null;
  return (
    <div className="flex bg-gradient-to-b from-slate-700 to-slate-800 items-center sticky h-10 2xl:h-11">
      {days.map((dayStr, colIndex) => {
        const day = parseInt(dayStr, 10);
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const { isAbsentDay, absenceType } = useIsAbsentDay(absences, date);
        const { isHoliday, holidayTitle } = useDayHoliday(year, month, day, holidays);
        const today = day === todayDate && month === todayMonth && year === todayYear

        const classList = [
          "w-9 h-10 2xl:w-10 2xl:h-11 flex justify-center items-center border-r border-slate-600 font-medium text-sm transition-colors",
          isWeekend(year, month, day) ? "bg-slate-600/50 text-slate-300" : "text-white",
          isHoliday && "!bg-emerald-600/40 !text-emerald-200",
          isAbsentDay && "!bg-amber-600/40 !text-amber-200",
          hoveredColIndex === colIndex && !isWeekend(year, month, day) && !isHoliday && !isAbsentDay && "!bg-blue-600/30",
          today && "!bg-blue-500 !text-white font-bold ring-2 ring-blue-400 ring-inset"
        ]
          .filter(Boolean)
          .join(" ");

        const tooltip = [holidayTitle, absenceType && `Absence: ${absenceType}`]
          .filter(Boolean)
          .join(" | ");

        return (
          <div key={dayStr} title={tooltip} className={classList}>
            {dayStr}
          </div>
        );
      })}
    </div>
  );
}
