"use client";

import { useEffect, useState, useMemo } from "react";
import { useCalendar } from "@/app/context/CalendarContext";
import { getDaysInMonth, isWeekend } from "@/app/utils/dateUtils";
import { useDayHoliday } from "@/app/hooks/useDayHoliday";
import { useIsAbsentDay } from "@/app/hooks/useIsAbsentDay";
import { useAbsenceContext } from "@/app/context/AbsencesContext";
import { useHolidayContext } from "@/app/context/HolidayContext";
import { HOLIDAY_CALENDAR_COLORS, getAbsenceColorConfig } from "@/app/utils/absenceCalendarColors";

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
    <div className="flex bg-gradient-to-r from-[#244B77] via-[#2d5a8a] to-[#244B77] items-center sticky h-10 2xl:h-11 rounded-t-lg">
      {days.map((dayStr, colIndex) => {
        const day = parseInt(dayStr, 10);
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const { isAbsentDay, absenceType } = useIsAbsentDay(absences, date);
        const { isHoliday, holidayTitle } = useDayHoliday(year, month, day, holidays);
        const today = day === todayDate && month === todayMonth && year === todayYear
        const absenceTopBarClass = !isHoliday && isAbsentDay
          ? getAbsenceColorConfig(absenceType).workhourTopBarClass
          : null;

        const classList = [
          "w-9 h-10 2xl:w-10 2xl:h-11 flex justify-center items-center border-r border-white/25 font-medium text-sm transition-colors",
          isWeekend(year, month, day) ? "bg-white/10 text-white/70" : "text-white",
          isHoliday && HOLIDAY_CALENDAR_COLORS.workhourTopBarClass,
          absenceTopBarClass,
          hoveredColIndex === colIndex && !isWeekend(year, month, day) && !isHoliday && !isAbsentDay && "!bg-white/20",
          today && "!bg-cyan-400 !text-[#244B77] font-bold shadow-lg shadow-cyan-400/30"
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
