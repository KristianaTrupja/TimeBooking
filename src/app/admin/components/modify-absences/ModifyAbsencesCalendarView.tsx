"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { User } from "@/types/user";

type DayHeader = {
  day: number;
  shortWeekday: string;
  isWeekend: boolean;
  holidayName?: string | null;
  isToday?: boolean;
};

type Props = {
  containerHeight: number | null;
  monthLabel: string;
  dayHeaders: DayHeader[];
  visibleEmployees: User[];
  getDayOffType: (userId: number, day: number) => string | null;
  getCellClass: (absenceType: string | null, isWeekend: boolean) => string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  employeeLabel: string;
  isCompact?: boolean;
};

export default function ModifyAbsencesCalendarView({
  containerHeight,
  monthLabel,
  dayHeaders,
  visibleEmployees,
  getDayOffType,
  getCellClass,
  onPrevMonth,
  onNextMonth,
  employeeLabel,
  isCompact = false,
}: Props) {
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  const dayColWidth = 40;
  const minTableWidth = 240 + dayHeaders.length * dayColWidth;

  return (
    <section
      className="rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden w-full"
      style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
    >
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-sm">
            <Calendar className="text-white" size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">Leave Calendar View</p>
            {!isCompact && <p className="text-xs text-slate-500">Employees and day-off timeline</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={onPrevMonth}
            className="h-8 w-8 rounded-lg hover:bg-white text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center flex-1 sm:flex-none">
            {monthLabel}
          </span>
          <button
            onClick={onNextMonth}
            className="h-8 w-8 rounded-lg hover:bg-white text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!isCompact && (
        <div className="shrink-0 px-3 sm:px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-100 text-teal-700">Vacation</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">Sick</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 text-violet-700">Personal</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">Parental</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700">🎉 Official Holiday</span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto custom-scrollbar" style={{ width: 0, minWidth: '100%' }}>
        <table
          className="border-collapse w-full"
          style={{ minWidth: `${minTableWidth}px` }}
        >
          <colgroup>
            <col style={{ minWidth: '200px' }} />
            {dayHeaders.map(({ day }) => (
              <col key={`col-${day}`} style={{ width: `${dayColWidth}px` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20 border-b border-slate-200">
            <tr className="text-xs uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3 font-bold text-left sticky left-0 bg-slate-100 z-30 border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] min-w-[200px]">
                {employeeLabel}
              </th>
              {dayHeaders.map(({ day, shortWeekday, isWeekend, holidayName, isToday }) => {
                const isColHovered = hoveredDay === day;
                const hasHoliday = !!holidayName;
                return (
                  <th
                    key={day}
                    className={`px-1 py-2 font-bold text-center transition-all duration-150 cursor-pointer z-20 ${
                      isToday 
                        ? "bg-gradient-to-b from-blue-500 to-blue-400 border-r-2 border-l-2 border-blue-600 shadow-md" 
                        : hasHoliday 
                        ? "bg-gradient-to-b from-red-100 to-red-50 border-r border-slate-200" 
                        : isWeekend 
                        ? "bg-slate-200/70 border-r border-slate-200" 
                        : "bg-slate-100 border-r border-slate-200"
                    } ${isColHovered && !isToday ? "!bg-blue-100 ring-2 ring-inset ring-blue-200" : ""}`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={isToday ? "Today" : holidayName || undefined}
                  >
                    <div className="leading-tight">
                      <div className={`text-[10px] transition-colors duration-150 ${
                        isToday ? "text-white font-bold" : hasHoliday ? "text-red-600" : isColHovered ? "text-blue-600" : "text-slate-500"
                      }`}>
                        {shortWeekday.slice(0, 2)}
                      </div>
                      <div className={`text-[11px] transition-colors duration-150 ${
                        isToday ? "text-white font-extrabold" : hasHoliday ? "text-red-700" : isColHovered ? "text-blue-700" : ""
                      }`}>
                        {String(day).padStart(2, "0")}
                      </div>
                      {hasHoliday && !isToday && (
                        <div className="text-red-500 text-[10px] leading-none mt-0.5">●</div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleEmployees.map((user) => {
              const isRowHovered = hoveredUserId === user.id;
              return (
                <tr 
                  key={user.id} 
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredUserId(user.id)}
                  onMouseLeave={() => setHoveredUserId(null)}
                >
                  <td 
                    className={`px-4 py-2 h-10 sticky left-0 z-10 border-r border-slate-200 transition-all duration-150 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] min-w-[200px] ${
                      isRowHovered ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate transition-colors duration-150 ${
                        isRowHovered ? "text-blue-700" : "text-slate-800"
                      }`}>
                        {user.username}
                      </span>
                    </div>
                  </td>

                  {dayHeaders.map(({ day, isWeekend, holidayName, isToday }) => {
                    const absenceType = getDayOffType(user.id, day);
                    const isHovered = isRowHovered || hoveredDay === day;
                    const hasHoliday = !!holidayName;
                    return (
                      <td
                        key={`${user.id}-${day}`}
                        className={`px-1 py-2 h-10 text-center text-[11px] transition-all duration-150 ${getCellClass(absenceType, isWeekend)} ${
                          hasHoliday && !absenceType ? "bg-red-50/50 border-r border-red-100" : ""
                        } ${
                          isHovered && !absenceType ? "!bg-blue-50 ring-1 ring-inset ring-blue-100" : ""
                        }`}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={hasHoliday ? holidayName : undefined}
                      >
                        {absenceType ? "●" : hasHoliday ? "🎉" : ""}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

