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
import { useLanguage } from "@/app/context/LanguageContext";

export default function BottomBar() {
  const { month, year } = useCalendar();
  const [holidays, loading] = useHolidayContext();
  const { getTotalHoursForDay } = useWorkHours();
  const pathname = usePathname();
  const userId = useMemo(() => pathname?.split("/")[2] || "", [pathname]);
  const [days, setDays] = useState<string[]>([]);
  const [absences, absenceLoading] = useAbsenceContext();
  const { t } = useLanguage();

  useEffect(() => {
    setDays(getDaysInMonth(year, month));
  }, [month, year]);

  if (absenceLoading || loading) return null;

  return (
    <div className="flex items-center mt-2">
      {days.map((day) => {
        const dayNumber = parseInt(day, 10);
        const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const totalHours = getTotalHoursForDay(formattedDate, userId);
        const isWeekendDay = isWeekend(year, month, dayNumber);
        const { isHoliday, holidayTitle } = useDayHoliday(year, month, dayNumber,holidays);
        const { isAbsentDay, absenceType } = useIsAbsentDay(absences, formattedDate);

        let bgColor = totalHours > 0 ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500";

        let borderColor = "border-slate-300";
        if (isAbsentDay) {
          borderColor = "border-amber-400";
          bgColor = "bg-amber-100 text-amber-700";
        } else if (isHoliday) {
          borderColor = "border-emerald-400";
          bgColor = "bg-emerald-100 text-emerald-700";
        } else if (isWeekendDay) {
          borderColor = "border-slate-400";
          bgColor = "bg-slate-100 text-slate-500";
        }

        const tooltip = [formattedDate, isHoliday && holidayTitle, isAbsentDay && `${t.absence}: ${absenceType}`]
          .filter(Boolean)
          .join(" | ");

        return (
          <div
            key={day}
            title={tooltip}
            className={`border-t-3 ${borderColor} w-9 h-7 2xl:h-8 2xl:w-10 flex justify-center items-center text-xs font-medium rounded-b ${bgColor}`}
          >
            {totalHours.toFixed(2)}
          </div>
        );
      })}
    </div>
  );
}
