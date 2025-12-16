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
  X
} from "lucide-react";
import { AbsenceType, ExtAbsence } from "@/types/absence";
import Spinner from "@/components/ui/Spinner";
import { getEndOfMonth } from "@/app/utils/dateUtils";

const ABSENCE_TYPES: (keyof typeof AbsenceType)[] = ["VACATION", "SICK", "PERSONAL", "PARENTAL"];

type APIRemainingDays = {
  currentYear: { year: number; daysLeft: number; daysSpent: number };
  lastYear: { year: number; daysLeft: number; daysSpent: number };
  totalDaysLeft: number;
};

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
};

function getInitialFiltersState() {
  const now = new Date();
  return {
    selectedAbsenceType: null as string | null,
    startDate: new Date(now.getFullYear(), 0, 1),
    endDate: getEndOfMonth(now),
  };
}

export default function DeveloperVacations() {
  const pathname = usePathname();
  const [absences, setAbsences] = useState<ExtAbsence[]>([]);
  const [remainingDays, setRemainingDays] = useState<APIRemainingDays | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(getInitialFiltersState());
  const [showFilters, setShowFilters] = useState(false);

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
      const data = await res.json();
      setRemainingDays(data);
    } catch (err) {
      console.error("Failed to fetch remaining days:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  useEffect(() => {
    fetchRemainingDays();
  }, [fetchRemainingDays]);

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

  // Sort absences by start date (most recent first)
  const sortedAbsences = useMemo(() => {
    return [...absences].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [absences]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalDays = absences.reduce((acc, a) => acc + (a.days || 0), 0);
    const byType = ABSENCE_TYPES.reduce((acc, type) => {
      acc[type] = absences.filter(a => a.type === type).reduce((sum, a) => sum + (a.days || 0), 0);
      return acc;
    }, {} as Record<string, number>);
    return { totalDays, byType };
  }, [absences]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-lg shadow-[#244B77]/20">
              <CalendarDays className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Leaves</h1>
              <p className="text-sm text-slate-600">View your time-off history</p>
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              showFilters || hasFiltersApplied()
                ? "bg-[#244B77] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Filter size={16} />
            Filters
            {hasFiltersApplied() && (
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Available */}
          <div className="bg-gradient-to-br from-[#244B77] to-[#1a3a5c] rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
              <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">Available</span>
            </div>
            <p className="text-3xl font-bold">
              {remainingDays?.totalDaysLeft ?? "—"}
              <span className="text-lg font-normal text-white/70 ml-1">days</span>
            </p>
          </div>

          {/* Current Year */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {remainingDays?.currentYear.year || new Date().getFullYear()}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {remainingDays?.currentYear.daysLeft ?? "—"}
              <span className="text-sm font-normal text-slate-500 ml-1">remaining</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {remainingDays?.currentYear.daysSpent ?? 0} days used
            </p>
          </div>

          {/* Last Year (Carried Over) */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                {remainingDays?.lastYear.year || new Date().getFullYear() - 1} Carried
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {remainingDays?.lastYear.daysLeft ?? "—"}
              <span className="text-sm font-normal text-amber-600 ml-1">days</span>
            </p>
          </div>

          {/* Total Taken (in filtered period) */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Palmtree size={14} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Period Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {stats.totalDays}
              <span className="text-sm font-normal text-blue-600 ml-1">days</span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {absences.length} {absences.length === 1 ? "record" : "records"}
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-end gap-4">
              {/* Date Range */}
              <div className="flex gap-3">
                <div>
                  <label htmlFor="filter-start" className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    From
                  </label>
                  <input
                    id="filter-start"
                    type="date"
                    value={filters.startDate.toISOString().slice(0, 10)}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/30"
                  />
                </div>
                <div>
                  <label htmlFor="filter-end" className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    To
                  </label>
                  <input
                    id="filter-end"
                    type="date"
                    value={filters.endDate.toISOString().slice(0, 10)}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/30"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label htmlFor="filter-type" className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Type
                </label>
                <select
                  id="filter-type"
                  value={filters.selectedAbsenceType || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, selectedAbsenceType: e.target.value || null }))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B77]/30 min-w-[140px]"
                >
                  <option value="">All Types</option>
                  {ABSENCE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Reset Button */}
              {hasFiltersApplied() && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <X size={14} />
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "calc(100vh - 450px)", minHeight: "300px" }}>
        {isLoading ? (
          <div className="h-64">
            <Spinner text="Loading your leaves..." />
          </div>
        ) : sortedAbsences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <CalendarDays size={32} className="text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700">No leaves found</p>
            <p className="text-sm text-slate-500 mt-1">
              {hasFiltersApplied() ? "Try adjusting your filters" : "You haven't taken any time off yet"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                <th className="px-6 py-3 font-bold bg-slate-100 w-12">#</th>
                <th className="px-6 py-3 font-bold bg-slate-100">Type</th>
                <th className="px-6 py-3 font-bold bg-slate-100">Start Date</th>
                <th className="px-6 py-3 font-bold bg-slate-100">End Date</th>
                <th className="px-6 py-3 font-bold bg-slate-100 text-center">Days</th>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Summary */}
      {!isLoading && sortedAbsences.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {ABSENCE_TYPES.map(type => {
                const count = stats.byType[type];
                if (count === 0) return null;
                const style = leaveTypeStyles[type];
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`${style.textColor}`}>{style.icon}</span>
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">{count}</span> {type.toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-sm text-slate-600">
              Total: <span className="font-bold text-slate-800">{stats.totalDays} days</span> across{" "}
              <span className="font-bold text-slate-800">{absences.length} records</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
