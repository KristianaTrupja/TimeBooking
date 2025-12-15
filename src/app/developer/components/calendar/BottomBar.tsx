"use client";

import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { usePathname } from "next/navigation";
import { getDaysInMonth, isWeekend } from "@/app/utils/dateUtils";
import { useDayHoliday } from "@/app/hooks/useDayHoliday";
import { useMemo, useState, useEffect } from "react";
import { useAbsenceContext } from "@/app/context/AbsencesContext";
import { useIsAbsentDay } from "@/app/hooks/useIsAbsentDay";
import { useHolidayContext } from "@/app/context/HolidayContext";

export default function BottomBar() {
  const { month, year } = useCalendar();
  const [holidays, loading] = useHolidayContext();
  const { getTotalHoursForDay } = useWorkHours();
  const pathname = usePathname();
  const userId = useMemo(() => pathname?.split("/")[2] || "", [pathname]);
  const [days, setDays] = useState<string[]>([]);
  const [absences, absenceLoading] = useAbsenceContext();

  useEffect(() => {
    setDays(getDaysInMonth(year, month));
  }, [month, year]);

  if (absenceLoading || loading) return null;

  return (
    <div className="flex items-center gap-1">
      {days.map((day) => {
        const dayNumber = parseInt(day, 10);
        const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const totalHours = getTotalHoursForDay(formattedDate, userId);
        const isWeekendDay = isWeekend(year, month, dayNumber);
        const { isHoliday, holidayTitle } = useDayHoliday(year, month, dayNumber,holidays);
        const { isAbsentDay, absenceType } = useIsAbsentDay(absences, formattedDate);

        let bgColor = totalHours > 0 ? "bg-blue-100" : "bg-white";

        let borderColor = "border-gray-300";
        if (isAbsentDay) {
          borderColor = "border-orange-400";
        } else if (isHoliday) {
          borderColor = "border-green-400";
        } else if (isWeekendDay) {
          borderColor = "border-red-400";
        }

        const tooltip = [formattedDate, isHoliday && holidayTitle, isAbsentDay && `Absence: ${absenceType}`]
          .filter(Boolean)
          .join(" | ");

        return (
          <div
            key={day}
            title={tooltip}
            className={`border-t-4 ${borderColor} w-8 h-6 2xl:h-8 2xl:w-9 flex justify-center items-center text-xs pt-1 ${bgColor}`}
          >
            {totalHours.toFixed(2)}
          </div>
        );
      })}
    </div>
  );
}
