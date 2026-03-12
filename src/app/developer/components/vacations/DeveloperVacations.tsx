"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { 
  CalendarDays, 
  Palmtree, 
  Stethoscope, 
  UserRound, 
  Baby,
  Calendar,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  List,
  Grid3X3
} from "lucide-react";
import { AbsenceStatus, AbsenceType, ExtAbsence } from "@/types/absence";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/app/context/LanguageContext";
import { User } from "@/types/user";
import ModifyAbsencesCalendarView from "@/app/admin/components/modify-absences/ModifyAbsencesCalendarView";
import AbsenceCard from "./AbsenceCard";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { toast } from "sonner";

const ABSENCE_TYPES: (keyof typeof AbsenceType)[] = [
  "VACATION",
  "SICK",
  "PERSONAL",
  "PARENTAL",
  "MARRIAGE",
  "BEREAVEMENT",
];

type APIRemainingDays = {
  currentYear: { year: number; daysLeft: number; daysSpent: number };
  lastYear: { year: number; daysLeft: number; daysSpent: number };
  totalDaysLeft: number;
};

function isRemainingDaysPayload(value: unknown): value is APIRemainingDays {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, any>;
  return (
    !!data.currentYear &&
    typeof data.currentYear.year === "number" &&
    !!data.lastYear &&
    typeof data.lastYear.year === "number" &&
    typeof data.totalDaysLeft === "number"
  );
}

// Leave type styles
const leaveTypeStyles: Record<string, { icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string }> = {
  VACATION: { 
    icon: <Palmtree size={14} />, 
    bgColor: "bg-teal-100", 
    textColor: "text-teal-700", 
    borderColor: "border-teal-300" 
  },
  SICK: { 
    icon: <Stethoscope size={14} />, 
    bgColor: "bg-rose-100", 
    textColor: "text-rose-700", 
    borderColor: "border-rose-300" 
  },
  PERSONAL: { 
    icon: <UserRound size={14} />, 
    bgColor: "bg-violet-100", 
    textColor: "text-violet-700", 
    borderColor: "border-violet-300" 
  },
  PARENTAL: { 
    icon: <Baby size={14} />, 
    bgColor: "bg-amber-100", 
    textColor: "text-amber-700", 
    borderColor: "border-amber-300" 
  },
  MARRIAGE: {
    icon: <Calendar size={14} />,
    bgColor: "bg-fuchsia-100",
    textColor: "text-fuchsia-700",
    borderColor: "border-fuchsia-300"
  },
  BEREAVEMENT: {
    icon: <CalendarDays size={14} />,
    bgColor: "bg-slate-200",
    textColor: "text-slate-700",
    borderColor: "border-slate-300"
  },
};

function getInitialFiltersState() {
  const now = new Date();
  return {
    selectedAbsenceType: null as string | null,
    startDate: new Date(now.getFullYear(), 0, 1),
    endDate: new Date(now.getFullYear(), 11, 31), // End of current year instead of end of current month
  };
}

type SortField = "type" | "startDate" | "endDate" | "days";
type SortDirection = "asc" | "desc" | null;
type ViewMode = "list" | "calendar";

export default function DeveloperVacations() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [absences, setAbsences] = useState<ExtAbsence[]>([]);
  const [allAbsences, setAllAbsences] = useState<ExtAbsence[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [holidays, setHolidays] = useState<Array<{ date: string; holiday: string; locationId: number }>>([]);
  const [remainingDays, setRemainingDays] = useState<APIRemainingDays | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [filters, setFilters] = useState(getInitialFiltersState());
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>("startDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const isMobile = useIsMobile();
  const isMobileLayout = useIsMobile(1024);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // When mobile, always keep expander expanded
  useEffect(() => {
    if (isMobile) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [isMobile]);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  // Translation map for absence types
  const absenceTypeLabels: Record<string, string> = {
    VACATION: t.vacation,
    SICK: t.sick,
    PERSONAL: t.personal,
    PARENTAL: t.parental,
    MARRIAGE: t.marriageLeave,
    BEREAVEMENT: t.bereavementLeave,
  };

  // Get user ID from URL
  const userId = useMemo(() => {
    const segments = pathname?.split("/") || [];
    return segments[2] || "";
  }, [pathname]);

  // Fetch absences
  const fetchAbsences = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const start = filters.startDate.toISOString().slice(0, 10);
      const end = filters.endDate.toISOString().slice(0, 10);
      const params = new URLSearchParams();
      params.append("startDate", start);
      params.append("endDate", end);
      params.append("userId", userId);
      if (filters.selectedAbsenceType) {
        params.append("absenceType", filters.selectedAbsenceType);
      }
      params.append("status", "ALL");

      const res = await fetch(`/api/absences?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      setAbsences(data.absences || []);
    } catch (err) {
      console.error("Failed to fetch absences:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters]);

  // Fetch remaining days
  const fetchRemainingDays = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/absences/${userId}`, { cache: "no-store" });
      if (!res.ok) {
        setRemainingDays(null);
        return;
      }
      const data = await res.json();
      setRemainingDays(isRemainingDaysPayload(data) ? data : null);
    } catch (err) {
      console.error("Failed to fetch remaining days:", err);
      setRemainingDays(null);
    }
  }, [userId]);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  useEffect(() => {
    fetchRemainingDays();
  }, [fetchRemainingDays]);

  // Fetch all employees and absences for calendar view
  const fetchTeamData = useCallback(async () => {
    if (viewMode !== "calendar") return;
    
    try {
      const [usersRes, allAbsencesRes, holidaysRes] = await Promise.all([
        fetch("/api/user", { cache: "no-store" }),
        fetch(`/api/absences?startDate=${calendarYear}-01-01&endDate=${calendarYear}-12-31&status=ALL`, { cache: "no-store" }),
        fetch(`/api/holidays?year=${calendarYear}&allLocations=true`, { cache: "no-store" }),
      ]);

      const usersData = await usersRes.json();
      const absencesData = await allAbsencesRes.json();
      const holidaysData = await holidaysRes.json();

      setEmployees(usersData.users || []);
      setAllAbsences(absencesData.absences || []);
      setHolidays(holidaysData.holidays || []);
    } catch (err) {
      console.error("Failed to fetch team data:", err);
    }
  }, [viewMode, calendarYear]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const hasFiltersApplied = useCallback(() => {
    const initial = getInitialFiltersState();
    return (
      filters.selectedAbsenceType !== null ||
      filters.startDate.getTime() !== initial.startDate.getTime() ||
      filters.endDate.getTime() !== initial.endDate.getTime()
    );
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(getInitialFiltersState());
  };

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-slate-400" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp size={14} className="text-[#244B77]" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown size={14} className="text-[#244B77]" />;
    }
    return <ArrowUpDown size={14} className="text-slate-400" />;
  }, [sortField, sortDirection]);

  // Sort absences
  const sortedAbsences = useMemo(() => {
    const sorted = [...absences];
    
    if (!sortField || !sortDirection) {
      // Default: sort by start date descending
      return sorted.sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    }

    return sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "startDate":
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case "endDate":
          comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          break;
        case "days":
          comparison = (a.days || 0) - (b.days || 0);
          break;
      }
      
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [absences, sortField, sortDirection]);

  // Calculate stats
  const stats = useMemo(() => {
    const effectiveAbsences = absences.filter((a) => a.status !== "REJECTED");
    const totalDays = effectiveAbsences.reduce((acc, a) => acc + (a.days || 0), 0);
    const byType = ABSENCE_TYPES.reduce((acc, type) => {
      acc[type] = effectiveAbsences.filter((a) => a.type === type).reduce((sum, a) => sum + (a.days || 0), 0);
      return acc;
    }, {} as Record<string, number>);
    return { totalDays, byType };
  }, [absences]);

  // Calendar view setup
  const calendarMonthStart = useMemo(
    () => new Date(Date.UTC(calendarYear, calendarMonth, 1, 0, 0, 0, 0)),
    [calendarYear, calendarMonth]
  );
  const calendarMonthEnd = useMemo(
    () => new Date(Date.UTC(calendarYear, calendarMonth + 1, 0, 23, 59, 59, 999)),
    [calendarYear, calendarMonth]
  );
  const daysInMonth = useMemo(
    () => new Date(calendarYear, calendarMonth + 1, 0).getDate(),
    [calendarYear, calendarMonth]
  );
  const monthLabel = useMemo(
    () => new Date(calendarYear, calendarMonth).toLocaleString("en-US", { month: "long", year: "numeric" }),
    [calendarYear, calendarMonth]
  );
  const dayColumns = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  
  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();
    holidays.forEach((holiday) => {
      map.set(`${holiday.locationId}-${holiday.date}`, holiday.holiday);
    });
    return map;
  }, [holidays]);

  const currentUserLocationId = useMemo(() => {
    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId)) return undefined;
    return employees.find((employee) => employee.id === numericUserId)?.locationId;
  }, [employees, userId]);

  const getHolidayName = useCallback((targetUserId: number, dateIso: string) => {
    const locationId = employees.find((employee) => employee.id === targetUserId)?.locationId;
    if (!locationId) return undefined;
    return holidayMap.get(`${locationId}-${dateIso}`);
  }, [employees, holidayMap]);
  
  const dayHeaders = useMemo(
    () => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();
      
      return dayColumns.map((day) => {
        const date = new Date(Date.UTC(calendarYear, calendarMonth, day));
        const shortWeekday = date.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" });
        const dayIndex = date.getUTCDay();
        const isWeekend = dayIndex === 0 || dayIndex === 6;
        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const holidayName = currentUserLocationId ? holidayMap.get(`${currentUserLocationId}-${dateStr}`) : undefined;
        const isToday = calendarYear === currentYear && calendarMonth === currentMonth && day === currentDay;
        return { day, dateIso: dateStr, shortWeekday, isWeekend, holidayName, isToday };
      });
    },
    [dayColumns, calendarYear, calendarMonth, currentUserLocationId, holidayMap]
  );

  const visibleEmployees = useMemo(() => {
    return [...employees].sort((a, b) => a.username.localeCompare(b.username));
  }, [employees]);

  const dayOffTypeMap = useMemo(() => {
    const map = new Map<string, string>();

    const toIsoDate = (d: Date) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    allAbsences.forEach((absence) => {
      const start = new Date(absence.startDate);
      const end = new Date(absence.endDate);
      const overlapStart = start > calendarMonthStart ? start : calendarMonthStart;
      const overlapEnd = end < calendarMonthEnd ? end : calendarMonthEnd;
      if (overlapStart > overlapEnd) return;

      const cursor = new Date(Date.UTC(
        overlapStart.getUTCFullYear(),
        overlapStart.getUTCMonth(),
        overlapStart.getUTCDate(),
        0, 0, 0, 0
      ));

      if (absence.status === "REJECTED") return;

      while (cursor <= overlapEnd) {
        const value = absence.status === "PENDING" ? `PENDING_${absence.type}` : absence.type;
        map.set(`${absence.userId}-${toIsoDate(cursor)}`, value);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    });

    return map;
  }, [allAbsences, calendarMonthStart, calendarMonthEnd]);

  const getDayOffType = useCallback((userId: number, day: number) => {
    const date = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dayOffTypeMap.get(`${userId}-${date}`) || null;
  }, [calendarYear, calendarMonth, dayOffTypeMap]);

  const getCellClass = useCallback((absenceType: string | null, isWeekend: boolean, isHoliday: boolean = false) => {
    if (isHoliday) return "bg-sky-50 text-slate-300 border-r border-sky-200";
    if (isWeekend) return "bg-slate-50 text-slate-300 border-r border-slate-100";
    if (!absenceType) return "bg-white text-slate-300 border-r border-slate-100";

    if (absenceType.startsWith("PENDING_")) return "bg-yellow-100 text-yellow-900 font-semibold border-r border-yellow-300";
    if (absenceType === "VACATION") return "bg-teal-200 text-teal-900 font-semibold border-r border-teal-300";
    if (absenceType === "SICK") return "bg-rose-200 text-rose-900 font-semibold border-r border-rose-300";
    if (absenceType === "PERSONAL") return "bg-violet-200 text-violet-900 font-semibold border-r border-violet-300";
    if (absenceType === "PARENTAL") return "bg-amber-200 text-amber-900 font-semibold border-r border-amber-300";
    if (absenceType === "MARRIAGE") return "bg-fuchsia-200 text-fuchsia-900 font-semibold border-r border-fuchsia-300";
    if (absenceType === "BEREAVEMENT") return "bg-slate-300 text-slate-900 font-semibold border-r border-slate-400";
    return "bg-blue-200 text-blue-900 font-semibold border-r border-blue-300";
  }, []);

  const handleCalendarRequest = useCallback(
    async ({
      userId: targetUserId,
      startDate,
      endDate,
      type,
    }: {
      userId: number;
      startDate: string;
      endDate: string;
      type: string;
    }) => {
      if (!userId || Number(userId) !== targetUserId) {
        return;
      }

      try {
        setIsSubmittingRequest(true);
        const response = await fetch("/api/absences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: targetUserId,
            startDate,
            endDate,
            type,
            status: AbsenceStatus.PENDING,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("Failed to submit leave request:", data.message);
          toast.error(data.message || "Failed to submit leave request");
          return;
        }

        toast.success(data.message || "Leave request submitted");
        await Promise.all([fetchAbsences(), fetchTeamData(), fetchRemainingDays()]);
      } catch (error) {
        console.error("Failed to submit leave request:", error);
        toast.error("Failed to submit leave request");
      } finally {
        setIsSubmittingRequest(false);
      }
    },
    [fetchAbsences, fetchRemainingDays, fetchTeamData, userId]
  );

  const handlePrevMonth = useCallback(() => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
      return;
    }
    setCalendarMonth((m) => m - 1);
  }, [calendarMonth]);

  const handleNextMonth = useCallback(() => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
      return;
    }
    setCalendarMonth((m) => m + 1);
  }, [calendarMonth]);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-lg shadow-[#244B77]/20">
              <CalendarDays className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{t.myLeaveBalance}</h1>
              <p className="text-xs sm:text-sm text-slate-600">{t.leaveHistory}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1 flex-1 sm:flex-initial">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  viewMode === "calendar"
                    ? "bg-white text-[#244B77] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                aria-label="Calendar view"
              >
                <Grid3X3 size={14} />
                <span className="hidden sm:inline">{t.calendarView}</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-white text-[#244B77] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                aria-label="List view"
              >
                <List size={14} />
                <span className="hidden sm:inline">{t.listView}</span>
              </button>
            </div>
            
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg sm:rounded-xl border transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 flex-shrink-0 ${
                isExpanded
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/35 ring-2 ring-cyan-200/60"
                  : "bg-gradient-to-br from-white to-slate-50 text-slate-700 border-slate-300 shadow-sm hover:shadow-md hover:border-cyan-400 hover:text-cyan-700"
              }`}
              aria-label={isExpanded ? "Collapse view" : "Expand view"}
              title={isExpanded ? "Collapse view" : "Expand view"}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        {!isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Available */}
          <div className="bg-gradient-to-br from-[#244B77] to-[#1a3a5c] rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
              <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">{t.availableDays}</span>
            </div>
            <p className="text-3xl font-bold">
              {remainingDays?.totalDaysLeft ?? "—"}
              <span className="text-lg font-normal text-white/70 ml-1">{t.days}</span>
            </p>
          </div>

          {/* Current Year */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {remainingDays?.currentYear?.year || new Date().getFullYear()}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {remainingDays?.currentYear?.daysLeft ?? "—"}
              <span className="text-sm font-normal text-slate-500 ml-1">{t.remainingDays.toLowerCase()}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {remainingDays?.currentYear?.daysSpent ?? 0} {t.usedDays.toLowerCase()}
            </p>
          </div>

          {/* Last Year (Carried Over) */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                {remainingDays?.lastYear?.year || new Date().getFullYear() - 1} {t.lastYear}
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {remainingDays?.lastYear?.daysLeft ?? "—"}
              <span className="text-sm font-normal text-amber-600 ml-1">{t.days}</span>
            </p>
          </div>

          {/* Total Taken (in filtered period) */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Palmtree size={14} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{t.totalDays}</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {stats.totalDays}
              <span className="text-sm font-normal text-blue-600 ml-1">{t.days}</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {absences.length} {absences.length === 1 ? t.day : t.days}
            </p>
          </div>
        </div>
        )}

        {/* Filter Toggle */}
        {!isExpanded && !showFilters && (
          <div className="flex justify-end mt-3 sm:mt-4">
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                hasFiltersApplied()
                  ? "bg-[#244B77] text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Filter size={14} />
              <span className="hidden sm:inline">{t.filters}</span>
              {hasFiltersApplied() && (
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400" />
              )}
            </button>
          </div>
        )}

        {/* Filters Panel */}
        {!isExpanded && showFilters && (
          <div className="mt-3 sm:mt-4 bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#244B77]" />
                <span className="text-sm font-semibold text-slate-800">{t.filters}</span>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={t.close}
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Filter Controls */}
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
                {/* Date Range */}
                <div className="flex items-end gap-2 flex-1 sm:flex-initial">
                  <div className="flex-1 sm:flex-initial">
                    <label htmlFor="filter-start" className="text-xs font-medium text-slate-500 mb-1 block">
                      {t.from}
                    </label>
                    <input
                      id="filter-start"
                      type="date"
                      value={filters.startDate.toISOString().slice(0, 10)}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                      className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/20 focus:border-[#244B77]/30 transition-all"
                    />
                  </div>
                  <span className="text-slate-400 mb-2 hidden sm:inline">→</span>
                  <div className="flex-1 sm:flex-initial">
                    <label htmlFor="filter-end" className="text-xs font-medium text-slate-500 mb-1 block">
                      {t.to}
                    </label>
                    <input
                      id="filter-end"
                      type="date"
                      value={filters.endDate.toISOString().slice(0, 10)}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                      className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/20 focus:border-[#244B77]/30 transition-all"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-10 bg-slate-200" />

                {/* Type Filter */}
                <div className="flex-1 sm:flex-initial">
                  <label htmlFor="filter-type" className="text-xs font-medium text-slate-500 mb-1 block">
                    {t.type}
                  </label>
                  <select
                    id="filter-type"
                    value={filters.selectedAbsenceType || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, selectedAbsenceType: e.target.value || null }))}
                    className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/20 focus:border-[#244B77]/30 min-w-[150px] transition-all"
                  >
                    <option value="">{t.type}</option>
                    {ABSENCE_TYPES.map(type => (
                      <option key={type} value={type}>{absenceTypeLabels[type] || type}</option>
                    ))}
                  </select>
                </div>

                {/* Reset Button */}
                {hasFiltersApplied() && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-200"
                  >
                    <X size={14} />
                    {t.reset}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      {viewMode === "calendar" ? (
        <div className="p-3 sm:p-4 md:p-6">
          <ModifyAbsencesCalendarView
            containerHeight={null}
            monthLabel={monthLabel}
            dayHeaders={dayHeaders}
            visibleEmployees={visibleEmployees}
            getDayOffType={getDayOffType}
            getHolidayName={getHolidayName}
            getCellClass={getCellClass}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            employeeLabel={t.employee || "Employee"}
            isCompact={false}
            requestTypeOptions={[
              { value: "VACATION", label: t.vacation },
              { value: "SICK", label: t.sick },
              { value: "PERSONAL", label: t.personal },
              { value: "PARENTAL", label: t.parental },
              { value: "MARRIAGE", label: t.marriageLeave },
              { value: "BEREAVEMENT", label: t.bereavementLeave },
            ]}
            requestableUserIds={userId ? [Number(userId)] : undefined}
            onRequestRange={handleCalendarRequest}
            isRequestSubmitting={isSubmittingRequest}
          />
        </div>
      ) : (
        <div
          className="overflow-y-visible lg:overflow-y-auto custom-scrollbar"
          style={!isMobileLayout ? { maxHeight: "calc(100vh - 450px)", minHeight: "300px" } : undefined}
        >
        {isLoading ? (
          <div className="h-64">
            <Spinner text={t.loading} />
          </div>
        ) : sortedAbsences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <CalendarDays size={32} className="text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700">{t.noLeavesFound}</p>
            <p className="text-sm text-slate-500 mt-1">
              {hasFiltersApplied() ? t.reset : t.noLeavesFound}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-6 py-3 font-bold bg-slate-100 w-12">#</th>
                    <th className="px-6 py-3 font-bold bg-slate-100">
                      <button 
                        onClick={() => handleSort("type")}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                      >
                        {t.type} {getSortIcon("type")}
                      </button>
                    </th>
                    <th className="px-6 py-3 font-bold bg-slate-100">
                      <button 
                        onClick={() => handleSort("startDate")}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                      >
                        {t.startDate} {getSortIcon("startDate")}
                      </button>
                    </th>
                    <th className="px-6 py-3 font-bold bg-slate-100">
                      <button 
                        onClick={() => handleSort("endDate")}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                      >
                        {t.endDate} {getSortIcon("endDate")}
                      </button>
                    </th>
                    <th className="px-6 py-3 font-bold bg-slate-100 text-center">
                      <button 
                        onClick={() => handleSort("days")}
                        className="flex items-center gap-1.5 hover:text-slate-900 transition-colors mx-auto"
                      >
                        {t.days} {getSortIcon("days")}
                      </button>
                    </th>
                    <th className="px-6 py-3 font-bold bg-slate-100 text-center">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedAbsences.map((absence, index) => {
                    const style = leaveTypeStyles[absence.type] || leaveTypeStyles.VACATION;
                    return (
                      <tr key={absence.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${style.bgColor} ${style.textColor} ${style.borderColor}`}>
                            {style.icon}
                            {absence.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-800 font-medium">{formatDate(absence.startDate)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-800 font-medium">{formatDate(absence.endDate)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg bg-slate-100 text-slate-800 font-bold text-sm">
                            {absence.days || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              absence.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : absence.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-700 border-rose-300"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-300"
                            }`}
                          >
                            {absence.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-3 space-y-3">
              {sortedAbsences.map((absence, index) => (
                <AbsenceCard
                  key={absence.id}
                  absence={absence}
                  index={index}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </>
        )}
        </div>
      )}

      {/* Footer Summary (List View Only) */}
      {viewMode === "list" && !isLoading && sortedAbsences.length > 0 && (
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {ABSENCE_TYPES.map(type => {
                const count = stats.byType[type];
                if (count === 0) return null;
                const style = leaveTypeStyles[type];
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`${style.textColor}`}>{style.icon}</span>
                    <span className="text-xs sm:text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">{count}</span> <span className="hidden sm:inline">{type.toLowerCase()}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs sm:text-sm text-slate-600">
              Total: <span className="font-bold text-slate-800">{stats.totalDays} days</span> across{" "}
              <span className="font-bold text-slate-800">{absences.length} records</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

