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
    <div className="flex bg-gray-100 items-center border-t border-b sticky h-9">
      {days.map((dayStr, colIndex) => {
        const day = parseInt(dayStr, 10);
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const { isAbsentDay, absenceType } = useIsAbsentDay(absences, date);
        const { isHoliday, holidayTitle } = useDayHoliday(year, month, day, holidays);
        const today = day === todayDate && month === todayMonth && year === todayYear

        const classList = [
          "border-gray-300 w-9 h-9 flex justify-center items-center border-l font-semibold",
          isWeekend(year, month, day) && "bg-gray-300",
          isHoliday && "bg-green-100",
          isAbsentDay && "bg-orange-100",
          hoveredColIndex === colIndex && !isWeekend(year, month, day) && !isHoliday &&  "bg-[#f1f7fde7]",
          today &&
            "bg-blue-100 text-blue-700 font-extrabold border-blue-500"
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
