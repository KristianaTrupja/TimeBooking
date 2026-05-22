"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { User } from "@/types/user";
import { formatEmployeeName } from "@/app/utils/formatEmployeeName";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  ABSENCE_TYPE_ORDER,
  PENDING_CALENDAR_COLORS,
  getAbsenceColorConfig,
} from "@/app/utils/absenceCalendarColors";

type DayHeader = {
  day: number;
  dateIso: string;
  shortWeekday: string;
  isWeekend: boolean;
  holidayName?: string | null;
  isToday?: boolean;
};

type RequestTypeOption = {
  value: string;
  label: string;
};

type RequestPayload = {
  userId: number;
  startDate: string;
  endDate: string;
  type: string;
};

type SelectionAnchor = {
  userId: number;
  dateIso: string;
};

type SelectionRange = {
  userId: number;
  startDateIso: string;
  endDateIso: string;
};

type Props = {
  containerHeight: number | null;
  monthLabel: string;
  dayHeaders: DayHeader[];
  visibleEmployees: User[];
  getDayOffType: (userId: number, day: number) => string | null;
  getHolidayName?: (userId: number, dateIso: string) => string | undefined;
  getCellClass: (absenceType: string | null, isWeekend: boolean, isHoliday?: boolean) => string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  employeeLabel: string;
  isCompact?: boolean;
  requestTypeOptions?: RequestTypeOption[];
  requestableUserIds?: number[];
  onRequestRange?: (payload: RequestPayload) => Promise<void>;
  isRequestSubmitting?: boolean;
};

export default function ModifyAbsencesCalendarView({
  containerHeight,
  monthLabel,
  dayHeaders,
  visibleEmployees,
  getDayOffType,
  getHolidayName,
  getCellClass,
  onPrevMonth,
  onNextMonth,
  employeeLabel,
  isCompact = false,
  requestTypeOptions = [],
  requestableUserIds,
  onRequestRange,
  isRequestSubmitting = false,
}: Props) {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<SelectionAnchor | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [requestType, setRequestType] = useState<string>("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const employeeColMobileWidth = 80;
  const dayColWidth = 40;
  const minTableWidth = employeeColMobileWidth + dayHeaders.length * dayColWidth;
  const isInteractive = !!onRequestRange;

  const selectableUsers = useMemo(
    () => (requestableUserIds?.length ? new Set(requestableUserIds) : null),
    [requestableUserIds]
  );

  const loggedInUserId = useMemo(() => {
    const rawId = session?.user?.id;
    if (!rawId) return null;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) ? numericId : null;
  }, [session?.user?.id]);

  const orderedEmployees = useMemo(() => {
    if (!loggedInUserId) return visibleEmployees;
    const index = visibleEmployees.findIndex((user) => user.id === loggedInUserId);
    if (index <= 0) return visibleEmployees;

    const reordered = [...visibleEmployees];
    const [loggedInUser] = reordered.splice(index, 1);
    if (!loggedInUser) return visibleEmployees;
    reordered.unshift(loggedInUser);
    return reordered;
  }, [visibleEmployees, loggedInUserId]);

  useEffect(() => {
    if (isInteractive) return;
    setSelectionAnchor(null);
    setSelectionRange(null);
  }, [isInteractive]);

  useEffect(() => {
    if (requestTypeOptions.length === 0) {
      setRequestType("");
      return;
    }
    if (requestType && !requestTypeOptions.some((option) => option.value === requestType)) {
      setRequestType("");
    }
  }, [requestTypeOptions, requestType]);

  // Mobile Safari first-render fix for sticky table headers in horizontal scrollers.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf1 = 0;
    let raf2 = 0;

    raf1 = window.requestAnimationFrame(() => {
      void scroller.offsetWidth;
      scroller.scrollLeft = 1;
      raf2 = window.requestAnimationFrame(() => {
        scroller.scrollLeft = 0;
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [monthLabel, dayHeaders.length]);

  const isSelectableUser = (userId: number) => {
    if (!isInteractive) return false;
    if (!selectableUsers) return true;
    return selectableUsers.has(userId);
  };

  const isRangeDaySelected = (userId: number, dateIso: string) => {
    if (!selectionRange || selectionRange.userId !== userId) return false;
    return dateIso >= selectionRange.startDateIso && dateIso <= selectionRange.endDateIso;
  };

  const handleCellClick = (userId: number, dateIso: string, absenceType: string | null) => {
    if (!isSelectableUser(userId) || absenceType) return;

    if (!selectionAnchor || selectionAnchor.userId !== userId) {
      setSelectionAnchor({ userId, dateIso });
      // Single click should be a valid 1-day request (start = end).
      setSelectionRange({ userId, startDateIso: dateIso, endDateIso: dateIso });
      return;
    }

    const [startDateIso, endDateIso] =
      selectionAnchor.dateIso <= dateIso
        ? [selectionAnchor.dateIso, dateIso]
        : [dateIso, selectionAnchor.dateIso];

    setSelectionRange({ userId, startDateIso, endDateIso });
    setSelectionAnchor(null);
  };

  const selectedRangeLabel = useMemo(() => {
    if (!selectionRange) return null;
    const startDate = new Date(`${selectionRange.startDateIso}T00:00:00.000Z`);
    const endDate = new Date(`${selectionRange.endDateIso}T00:00:00.000Z`);
    return `${startDate.toLocaleDateString("en-GB")} - ${endDate.toLocaleDateString("en-GB")}`;
  }, [selectionRange]);

  const submitRange = async () => {
    if (!onRequestRange || !selectionRange) return;
    if (!requestType) return;

    await onRequestRange({
      userId: selectionRange.userId,
      startDate: selectionRange.startDateIso,
      endDate: selectionRange.endDateIso,
      type: requestType,
    });

    setSelectionRange(null);
    setSelectionAnchor(null);
  };

  const absenceLegendItems = [
    { type: "VACATION", label: t.vacation },
    { type: "OFFICIAL_HOLIDAYS", label: t.officialHolidays },
    { type: "SICK", label: t.sick },
    { type: "HOME_OFFICE", label: t.homeOffice },
    { type: "OTHER", label: t.other },
  ];

  return (
    <section
      className="rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col overflow-hidden w-full max-w-full"
      style={{ maxHeight: containerHeight ? `${containerHeight}px` : undefined }}
    >
      <div className="shrink-0 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-sm">
            <Calendar className="text-white" size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{t.leaveCalendarView}</p>
            {!isCompact && <p className="text-xs text-slate-500">{t.employeesDayOffTimeline}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={onPrevMonth}
            className="h-8 w-8 rounded-lg hover:bg-white text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center"
            aria-label={t.previousMonth}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center flex-1 sm:flex-none">
            {monthLabel}
          </span>
          <button
            onClick={onNextMonth}
            className="h-8 w-8 rounded-lg hover:bg-white text-slate-600 hover:text-slate-800 transition-colors flex items-center justify-center"
            aria-label={t.nextMonth}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!isCompact && (
        <div className="shrink-0 px-3 sm:px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {ABSENCE_TYPE_ORDER.map((type) => {
            const item = absenceLegendItems.find((legendItem) => legendItem.type === type);
            if (!item) return null;

            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${getAbsenceColorConfig(type).legendChipClass}`}
              >
                {item.label}
              </span>
            );
          })}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${PENDING_CALENDAR_COLORS.legendChipClass}`}>{t.pending}</span>
        </div>
      )}

      {isInteractive && (
        <div className="shrink-0 px-3 sm:px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center gap-3">
          <p className="text-xs text-slate-600">
            {selectionRange
              ? `Selected: ${selectedRangeLabel || `${selectionRange.startDateIso} - ${selectionRange.endDateIso}`}`
              : selectionAnchor
                ? `Start selected: ${new Date(`${selectionAnchor.dateIso}T00:00:00.000Z`).toLocaleDateString("en-GB")}. Click another date for the end.`
                : "Click two cells on the same row to create a leave interval."}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:ml-auto">
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-800"
            >
              <option value="" disabled>
                {t.selectLeaveType}
              </option>
              {requestTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={submitRange}
              disabled={!selectionRange || !requestType || isRequestSubmitting}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
            >
              {isRequestSubmitting ? `${t.saving}` : t.submit}
            </button>
            <button
              onClick={() => {
                setSelectionAnchor(null);
                setSelectionRange(null);
              }}
              disabled={!selectionAnchor && !selectionRange}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              {t.reset}
            </button>
          </div>
        </div>
      )}

      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 min-w-0 max-w-full overflow-x-auto overflow-y-auto custom-scrollbar [--employee-col-width:80px] md:[--employee-col-width:200px] [--day-col-width:40px]"
        style={{ width: 0, minWidth: "100%" }}
        role="region"
        aria-labelledby="calendar-caption"
        tabIndex={0}
      >
        <table
          className="border-collapse w-full"
          style={{ minWidth: `${minTableWidth}px` }}
          role="table"
          aria-label={t.employeeLeaveCalendar}
        >
          <caption id="calendar-caption" className="sr-only">
            {t.leaveCalendarCaption.replace("{month}", monthLabel)}
          </caption>
          <colgroup>
            <col style={{ width: "var(--employee-col-width)", minWidth: "var(--employee-col-width)", maxWidth: "var(--employee-col-width)" }} />
            {dayHeaders.map(({ day }) => (
              <col key={`col-${day}`} style={{ width: "var(--day-col-width)", minWidth: "var(--day-col-width)", maxWidth: "var(--day-col-width)" }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20 border-b border-slate-200">
            <tr className="text-xs uppercase tracking-wider text-slate-600">
              <th
                scope="col"
                style={{ width: "var(--employee-col-width)", minWidth: "var(--employee-col-width)", maxWidth: "var(--employee-col-width)" }}
                className="px-2 sm:px-4 py-3 font-bold text-left sticky left-0 bg-slate-100 z-30 border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
              >
                {employeeLabel}
              </th>
              {dayHeaders.map(({ day, shortWeekday, isWeekend, holidayName, isToday }) => {
                const isColHovered = hoveredDay === day;
                const hasHoliday = !!holidayName;
                return (
                  <th
                    key={day}
                    scope="col"
                    className={`px-1 py-2 font-bold text-center transition-all duration-150 cursor-pointer z-20 ${
                      isToday
                        ? "bg-gradient-to-b from-blue-500 to-blue-400 border-r-2 border-l-2 border-blue-600 shadow-md"
                        : hasHoliday
                          ? "bg-gradient-to-b from-sky-200 to-sky-100 border-r border-sky-300"
                          : isWeekend
                            ? "bg-slate-200/70 border-r border-slate-200"
                            : "bg-slate-100 border-r border-slate-200"
                    } ${isColHovered && !isToday ? "!bg-blue-100 ring-2 ring-inset ring-blue-200" : ""}`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={isToday ? t.today : holidayName || undefined}
                  >
                    <div className="leading-tight">
                      <div
                        className={`text-[10px] transition-colors duration-150 ${
                          isToday ? "text-white font-bold" : hasHoliday ? "text-sky-800" : isColHovered ? "text-blue-600" : "text-slate-500"
                        }`}
                      >
                        {shortWeekday.slice(0, 2)}
                      </div>
                      <div
                        className={`text-[11px] transition-colors duration-150 ${
                          isToday ? "text-white font-extrabold" : hasHoliday ? "text-sky-900" : isColHovered ? "text-blue-700" : ""
                        }`}
                      >
                        {String(day).padStart(2, "0")}
                      </div>
                      {hasHoliday && !isToday && <div className="text-sky-600 text-[10px] leading-none mt-0.5">*</div>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {orderedEmployees.map((user) => {
              const isRowHovered = hoveredUserId === user.id;
              const isLoggedInUser = loggedInUserId === user.id;
              const rowInteractive = isSelectableUser(user.id);
              return (
                <tr
                  key={user.id}
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredUserId(user.id)}
                  onMouseLeave={() => setHoveredUserId(null)}
                >
                  <th
                    scope="row"
                    style={{ width: "var(--employee-col-width)", minWidth: "var(--employee-col-width)", maxWidth: "var(--employee-col-width)" }}
                    className={`px-2 sm:px-4 py-2 h-10 sticky left-0 z-10 border-r border-slate-200 transition-all duration-150 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] ${
                      isRowHovered ? "bg-blue-50" : isLoggedInUser ? "bg-blue-50/60" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium truncate transition-colors duration-150 ${
                          isLoggedInUser
                            ? isRowHovered
                              ? "text-blue-900 font-semibold"
                              : "text-blue-800 font-semibold"
                            : isRowHovered
                              ? "text-blue-700"
                              : "text-slate-800"
                        }`}
                      >
                        <span className="md:hidden">{formatEmployeeName(user.username)}</span>
                        <span className="hidden md:inline">{user.username}</span>
                      </span>
                      {isInteractive && !rowInteractive && (
                        <span className="text-[10px] font-semibold uppercase text-slate-400">{t.locked}</span>
                      )}
                    </div>
                  </th>

                  {dayHeaders.map(({ day, dateIso, isWeekend, holidayName }) => {
                    const absenceType = getDayOffType(user.id, day);
                    const isHovered = isRowHovered || hoveredDay === day;
                    const holidayNameForUser = getHolidayName?.(user.id, dateIso) ?? holidayName;
                    const hasHoliday = !!holidayNameForUser;
                    const showMarker = !isWeekend && (Boolean(absenceType) || hasHoliday);
                    const isCellSelected = isRangeDaySelected(user.id, dateIso);
                    const isAnchorCell = selectionAnchor?.userId === user.id && selectionAnchor.dateIso === dateIso;
                    const canSelectCell = rowInteractive && !absenceType;

                    return (
                      <td
                        key={`${user.id}-${day}`}
                        className={`relative overflow-hidden px-1 py-2 h-10 text-center text-[11px] transition-all duration-150 ${getCellClass(absenceType, isWeekend, hasHoliday)} ${
                          isHovered && !absenceType && !hasHoliday && !isWeekend
                            ? "!bg-blue-50 ring-1 ring-inset ring-blue-100"
                            : ""
                        } ${canSelectCell ? "cursor-pointer" : "cursor-default"} ${
                          isCellSelected ? "!bg-cyan-100 ring-2 ring-inset ring-cyan-400" : ""
                        } ${isAnchorCell ? "!bg-cyan-200 ring-2 ring-inset ring-cyan-500" : ""}`}
                        onClick={() => handleCellClick(user.id, dateIso, absenceType)}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={hasHoliday ? holidayNameForUser : undefined}
                      >
                        <span className="relative z-10">{showMarker ? "*" : ""}</span>
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
