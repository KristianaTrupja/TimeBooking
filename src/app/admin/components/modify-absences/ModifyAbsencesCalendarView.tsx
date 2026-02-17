"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { User } from "@/types/user";

type DayHeader = {
  day: number;
  shortWeekday: string;
  isWeekend: boolean;
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
}: Props) {
  return (
    <section
      className="overflow-y-auto rounded-xl flex-1 custom-scrollbar bg-white border border-slate-200 shadow-sm"
      style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
    >
      <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-sm">
            <Calendar className="text-white" size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Leave Calendar View</p>
            <p className="text-xs text-slate-500">Employees and day-off timeline</p>
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
          <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center flex-1 sm:flex-none">{monthLabel}</span>
          <button
            onClick={onNextMonth}
            className="h-8 w-8 rounded-lg hover:bg-white text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-100 text-teal-700">Vacation</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">Sick</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 text-violet-700">Personal</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">Parental</span>
      </div>

      <div className="overflow-x-auto custom-scrollbar w-full">
        <table className="w-full min-w-[1200px] border-collapse table-fixed">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr className="text-xs uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3 font-bold text-left w-[240px] sticky left-0 bg-slate-100 z-20 border-r border-slate-200">
                {employeeLabel}
              </th>
              {dayHeaders.map(({ day, shortWeekday, isWeekend }) => (
                <th
                  key={day}
                  className={`px-1 py-2 font-bold text-center border-r border-slate-200 ${isWeekend ? "bg-slate-200/70" : "bg-slate-100"}`}
                >
                  <div className="leading-tight">
                    <div className="text-[10px] text-slate-500">{shortWeekday.slice(0, 2)}</div>
                    <div className="text-[11px]">{String(day).padStart(2, "0")}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleEmployees.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-2 h-10 sticky left-0 bg-white z-10 border-r border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 truncate">{user.username}</span>
                  </div>
                </td>
                {dayHeaders.map(({ day, isWeekend }) => {
                  const absenceType = getDayOffType(user.id, day);
                  return (
                    <td key={`${user.id}-${day}`} className={`px-1 py-2 h-10 text-center text-[11px] ${getCellClass(absenceType, isWeekend)}`}>
                      {absenceType ? "●" : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
