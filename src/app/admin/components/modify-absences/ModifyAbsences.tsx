"use client";

import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarX, Calendar, List, Grid3X3, ChevronDown, ChevronUp } from "lucide-react";

type SortField = "startDate" | "endDate" | "type" | "days";
type SortDirection = "asc" | "desc" | null;
type ViewMode = "list" | "calendar";
import { User } from "@/types/user";
import { Absence, AbsenceStatus, AbsenceType, ExtAbsence, Filters } from "@/types/absence";
import Spinner from "@/components/ui/Spinner";
import FilterAbsences from "../absence-filters/FilterAbsences";
import { toast } from "sonner";
import { useLanguage } from "@/app/context/LanguageContext";
import ModifyAbsencesCalendarView from "./ModifyAbsencesCalendarView";
import ModifyAbsencesListView from "./ModifyAbsencesListView";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";

const ABSENCE_TYPES: (keyof typeof AbsenceType)[] = [
  "VACATION",
  "SICK",
  "PERSONAL",
  "PARENTAL",
  "MARRIAGE",
  "BEREAVEMENT",
]

function getInitialFiltersState(): Filters {
  const now = new Date();
  return {
    selectedAbsenceType: null,
    selectedEmployee: null,
    startDate: new Date(now.getFullYear(), 0, 1),
    endDate: new Date(now.getFullYear(), 11, 31) // End of current year instead of end of current month
  }
}


export default function ModifyAbsences() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [employees, setEmployees] = useState<User[]>([]);
  const [absences, setAbsences] = useState<ExtAbsence[]>([]);
  const [holidays, setHolidays] = useState<Array<{ date: string; holiday: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [absenceToDeleteId, setAbsenceToDeleteId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>(getInitialFiltersState());
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [scrollToAbsence, setScrollToAbsence] = useState<{ userId: number; startDate: string } | null>(null);
  const [hasProcessedParams, setHasProcessedParams] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>("startDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const isMobile = useIsMobile();
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  
  // When mobile, always keep expander collapsed
  useEffect(() => {
    if (isMobile) {
      setIsTableExpanded(true);
    } else {
      setIsTableExpanded(false);
    }
  }, [isMobile]);
  const sectionRef = useRef<HTMLElement>(null);
  const filtersRef = useRef<HTMLElement>(null);
  const absenceRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Handle URL params for scrolling to specific absence
  useEffect(() => {
    if (hasProcessedParams) return;
    
    const highlightUserIdParam = searchParams.get("highlightUserId");
    const startDateParam = searchParams.get("startDate");
    
    if (highlightUserIdParam && startDateParam) {
      setScrollToAbsence({
        userId: parseInt(highlightUserIdParam),
        startDate: startDateParam
      });
      setHasProcessedParams(true);
    } else {
      setHasProcessedParams(true);
    }
  }, [searchParams, hasProcessedParams]);

  // Scroll to the specific absence row when data is loaded
  useEffect(() => {
    if (scrollToAbsence && !isLoading) {
      const key = `${scrollToAbsence.userId}-${scrollToAbsence.startDate}`;
      const rowElement = absenceRowRefs.current.get(key);
      if (rowElement) {
        setTimeout(() => {
          rowElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }, 100);
      }
    }
  }, [scrollToAbsence, isLoading, absences]);

  const calculateHeight = useCallback(() => {
    if (sectionRef.current && filtersRef.current) {
      if (window.innerWidth >= 1024) {
        const sectionTop = sectionRef.current.getBoundingClientRect().top;
        const filtersStyles = window.getComputedStyle(filtersRef.current);
        const filtersHeight = filtersRef.current.offsetHeight + 
          parseFloat(filtersStyles.marginTop) + parseFloat(filtersStyles.marginBottom);
        const bottomPadding = 24;
        const availableHeight = window.innerHeight - sectionTop - filtersHeight - bottomPadding;
        setContainerHeight(Math.max(availableHeight, 200));
      } else {
        setContainerHeight(null);
      }
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight, isLoading, isTableExpanded]);

  const fetchData = useCallback(async () => {
    try {
      const start = filters.startDate.toISOString().slice(0, 10)
      const end = filters.endDate.toISOString().slice(0, 10)
      const params: URLSearchParams = new URLSearchParams()
      params.append("startDate", start)
      params.append("endDate", end)
      params.append("userId", filters.selectedEmployee?.id ? String(filters.selectedEmployee.id) :  "")
      params.append("absenceType", filters.selectedAbsenceType || "")
      params.append("status", "ALL")

      const [absRes, userRes, holidaysRes] = await Promise.all([
        fetch(`/api/absences?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/user?includeInactive=true", { cache: "no-store" }),
        fetch("/api/holidays", { cache: "no-store" }),
      ]);

      const absData = await absRes.json();
      const userData = await userRes.json();
      const holidaysData = await holidaysRes.json();
     

      setAbsences(absData.absences || []);
      setEmployees(userData.users || []);
      setHolidays(holidaysData.holidays || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [filters])


  useEffect(() => {
    fetchData()
  }, [filters])

  function handleOnFiltersChange(filters:Filters) {
    setFilters(filters)
  }

  function handleFiltersReset(){
    setFilters(getInitialFiltersState())
  }

  const hasFiltersApplied = useCallback(() => {
    const initial = getInitialFiltersState();
    return (
      filters.selectedAbsenceType !== null ||
      filters.selectedEmployee !== null ||
      filters.startDate.getTime() !== initial.startDate.getTime() ||
      filters.endDate.getTime() !== initial.endDate.getTime()
    );
  }, [filters])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // const getUsername = (userId: string | number) =>
  //   employees.find((user) => user.id === Number(userId))?.username || "—";

  const handleDelete = (id: number) => {
    setAbsenceToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (absenceToDeleteId === null) return;
    const id = absenceToDeleteId;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/absences?id=${id}`, { method: "DELETE" });

      if (res.ok) {
        setAbsences((prev) => prev.filter((a) => a.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete absence");
      }
    } catch (err) {
      console.error("Error deleting absence:", err);
    } finally {
      setDeletingId(null);
      setAbsenceToDeleteId(null);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingAbsence) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/absences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAbsence),
      });

      if (res.ok) {
        const updated = await res.json();
        setAbsences((prev) =>
          prev.map((a) =>
            a.id === updated.absence.id ? updated.absence : a
          )
        );
        setEditingAbsence(null);
      } else {
        const data = await res.json();
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setIsSaving(false);
    }
  }

  // Get absence type badge color
  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      VACATION: "bg-teal-100 text-teal-700 border-teal-300",
      SICK: "bg-rose-100 text-rose-700 border-rose-300",
      PERSONAL: "bg-violet-100 text-violet-700 border-violet-300",
      PARENTAL: "bg-amber-100 text-amber-700 border-amber-300",
      MARRIAGE: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300",
      BEREAVEMENT: "bg-slate-200 text-slate-700 border-slate-300",
    };
    return styles[type] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
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

  const sortAbsences = useCallback((absencesToSort: ExtAbsence[]) => {
    if (!sortField || !sortDirection) {
      return [...absencesToSort].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    }

    return [...absencesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "startDate":
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case "endDate":
          comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "days":
          comparison = a.days - b.days;
          break;
      }
      
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [sortField, sortDirection]);

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
      map.set(holiday.date, holiday.holiday);
    });
    return map;
  }, [holidays]);
  
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
        const holidayName = holidayMap.get(dateStr);
        const isToday = calendarYear === currentYear && calendarMonth === currentMonth && day === currentDay;
        return { day, dateIso: dateStr, shortWeekday, isWeekend, holidayName, isToday };
      });
    },
    [dayColumns, calendarYear, calendarMonth, holidayMap]
  );

  const visibleEmployees = useMemo(() => {
    const list = [...employees].sort((a, b) => (a.username).localeCompare(b.username));
    if (!filters.selectedEmployee) return list;
    return list.filter((u) => u.id === filters.selectedEmployee?.id);
  }, [employees, filters.selectedEmployee]);

  const dayOffTypeMap = useMemo(() => {
    const map = new Map<string, string>();

    const toIsoDate = (d: Date) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    absences.forEach((absence) => {
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
  }, [absences, calendarMonthStart, calendarMonthEnd]);

  const getDayOffType = useCallback((userId: number, day: number) => {
    const date = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dayOffTypeMap.get(`${userId}-${date}`) || null;
  }, [calendarYear, calendarMonth, dayOffTypeMap]);

  const getCellClass = useCallback((absenceType: string | null, isWeekend: boolean, isHoliday: boolean = false) => {
    if (isHoliday) return "bg-sky-50/70 text-slate-300 border-r border-sky-200";
    if (isWeekend) return "bg-slate-50/90 text-slate-300 border-r border-slate-100";
    if (!absenceType) return "bg-white text-slate-300 border-r border-slate-100";

    if (absenceType.startsWith("PENDING_")) {
      return "bg-yellow-100/90 text-yellow-900 font-semibold border-r border-yellow-300/60";
    }
    if (absenceType === "VACATION") return "bg-teal-200/90 text-teal-900 font-semibold border-r border-teal-300/40";
    if (absenceType === "SICK") return "bg-rose-200/90 text-rose-900 font-semibold border-r border-rose-300/40";
    if (absenceType === "PERSONAL") return "bg-violet-200/90 text-violet-900 font-semibold border-r border-violet-300/40";
    if (absenceType === "PARENTAL") return "bg-amber-200/90 text-amber-900 font-semibold border-r border-amber-300/40";
    if (absenceType === "MARRIAGE") return "bg-fuchsia-200/90 text-fuchsia-900 font-semibold border-r border-fuchsia-300/40";
    if (absenceType === "BEREAVEMENT") return "bg-slate-300/90 text-slate-900 font-semibold border-r border-slate-400/40";
    return "bg-blue-200/90 text-blue-900 font-semibold border-r border-blue-300/40";
  }, []);

  const handleCalendarRequest = useCallback(
    async ({
      userId,
      startDate,
      endDate,
      type,
    }: {
      userId: number;
      startDate: string;
      endDate: string;
      type: string;
    }) => {
      try {
        setIsSubmittingRequest(true);
        const res = await fetch("/api/absences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            startDate,
            endDate,
            type,
            status: AbsenceStatus.PENDING,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Failed to submit leave request");
          return;
        }

        toast.success(data.message || "Leave request submitted");
        fetchData();
      } catch (error) {
        console.error("Failed to submit leave request:", error);
        toast.error("Failed to submit leave request");
      } finally {
        setIsSubmittingRequest(false);
      }
    },
    [fetchData]
  );

  const handleReviewAbsence = useCallback(
    async (id: number, status: "APPROVED" | "REJECTED") => {
      try {
        setReviewingId(id);
        const res = await fetch("/api/absences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Failed to review leave request");
          return;
        }

        setAbsences((prev) => prev.map((absence) => (absence.id === id ? data.absence : absence)));
        toast.success(data.message || "Leave request updated");
      } catch (error) {
        console.error("Failed to review leave request:", error);
        toast.error("Failed to review leave request");
      } finally {
        setReviewingId(null);
      }
    },
    []
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
    <section ref={sectionRef} className="p-3 py-6 sm:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-left sm:items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-rose-400/20">
            <CalendarX className="text-white" size={20} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t.absenceRecords}</h1>
            <p className="text-sm text-slate-600">{t.viewManageAbsences}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-3 items-center">
          <button
            onClick={() => setIsTableExpanded((prev) => !prev)}
            className={`h-10 w-10 rounded-xl border transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 ${
              isTableExpanded
                ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/35 ring-2 ring-cyan-200/60"
                : "bg-gradient-to-br from-white to-slate-50 text-slate-700 border-slate-300 shadow-sm hover:shadow-md hover:border-cyan-400 hover:text-cyan-700"
            }`}
            aria-label={isTableExpanded ? "Collapse table view" : "Expand table view"}
            title={isTableExpanded ? "Collapse table view" : "Expand table view"}
          >
            {isTableExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              onClick={() => setViewMode("calendar")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "calendar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
              aria-label={t.switchToCalendarView}
            >
              <Grid3X3 size={14} />
              {t.calendarView}
            </button>
            
            <button
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
              aria-label={t.switchToListView}
            >
              <List size={14} />
              {t.listView}
            </button>
          </div>
          </div>
          <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2 border border-slate-200" title={t.records}>
            <Calendar size={16} className="text-slate-600" aria-hidden="true" />
            <span className="text-slate-800 font-bold">{absences.length}</span>
            <span className="text-slate-600 text-sm font-medium">{t.records}</span>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <section ref={filtersRef} className={`${isTableExpanded ? "hidden" : "block"} mb-5 bg-white rounded-xl border border-slate-200 p-4 shadow-sm`}>
        <FilterAbsences
          absences={absences}
          employees={employees} 
          absenceTypes={ABSENCE_TYPES}
          filters={filters}
          hasFilters={hasFiltersApplied()}
          onReset={handleFiltersReset}
          onFiltersChange={handleOnFiltersChange}
        />
      </section>

      {/* Content Section */}
      {isLoading ? (
        <div className="flex-1">
          <Spinner text={t.loadingAbsences} />
        </div>
      ) : viewMode === "calendar" ? (
        <ModifyAbsencesCalendarView
          containerHeight={containerHeight}
          monthLabel={monthLabel}
          dayHeaders={dayHeaders}
          visibleEmployees={visibleEmployees}
          getDayOffType={getDayOffType}
          getCellClass={getCellClass}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          employeeLabel={t.employee}
          isCompact={isTableExpanded}
          requestTypeOptions={[
            { value: "VACATION", label: t.vacation },
            { value: "SICK", label: t.sick },
            { value: "PERSONAL", label: t.personal },
            { value: "PARENTAL", label: t.parental },
            { value: "MARRIAGE", label: t.marriageLeave },
            { value: "BEREAVEMENT", label: t.bereavementLeave },
          ]}
          onRequestRange={handleCalendarRequest}
          isRequestSubmitting={isSubmittingRequest}
        />
      ) : (
        <ModifyAbsencesListView
          containerHeight={containerHeight}
          absences={absences}
          employees={employees}
          editingAbsence={editingAbsence}
          isSaving={isSaving}
          deletingId={deletingId}
          reviewingId={reviewingId}
          scrollToAbsence={scrollToAbsence}
          absenceRowRefs={absenceRowRefs}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          sortAbsences={sortAbsences}
          setEditingAbsence={setEditingAbsence}
          onEditSubmit={handleEditSubmit}
          onDelete={handleDelete}
          onReview={handleReviewAbsence}
          formatDate={formatDate}
          getTypeBadge={getTypeBadge}
          t={{
            noAbsencesFound: t.noAbsencesFound,
            adjustFilters: t.adjustFilters,
            startDate: t.startDate,
            endDate: t.endDate,
            type: t.type,
            days: t.days,
            actions: t.actions,
            status: t.status,
            absence: t.absence,
            absences: t.absences,
          }}
        />
      )}
      <Modal
        isOpen={absenceToDeleteId !== null}
        onClose={() => {
          if (deletingId !== null) return;
          setAbsenceToDeleteId(null);
        }}
        title={t.deleteAbsenceTitle}
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setAbsenceToDeleteId(null)}
              disabled={deletingId !== null}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={confirmDelete}
              loading={deletingId !== null}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              {t.delete}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          {t.deleteAbsenceConfirm}
        </p>
      </Modal>
    </section>
  );
}
