"use client";

import React, { useCallback, useMemo, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { useHolidayContext } from "@/app/context/HolidayContext";
import { useLanguage } from "@/app/context/LanguageContext";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CalendarHeart,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SortField = "date" | "title";
type SortDirection = "asc" | "desc" | null;

export default function DeveloperHolidays() {
  const { t, language } = useLanguage();
  const [holidays, loading] = useHolidayContext();
  const [year, setYear] = useState(new Date().getFullYear());
  const [sortField, setSortField] = useState<SortField | null>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isExpanded, setIsExpanded] = useState(false);

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

  const yearHolidays = useMemo(() => {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    return holidays.filter((h) => h.date >= start && h.date <= end);
  }, [holidays, year]);

  const sortedHolidays = useMemo(() => {
    const sorted = [...yearHolidays];

    if (!sortField || !sortDirection) {
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [yearHolidays, sortField, sortDirection]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = yearHolidays.filter((v) => new Date(v.date) >= today).length;
    const past = yearHolidays.filter((v) => new Date(v.date) < today).length;

    const sortedUpcoming = yearHolidays
      .filter((v) => new Date(v.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const nextHoliday = sortedUpcoming[0] ?? null;
    return { total: yearHolidays.length, upcoming, past, nextHoliday };
  }, [yearHolidays]);

  const formatToDayMonth = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "long",
    });
  }, [language]);

  if (loading) return <Spinner text={t.loadingHolidays} />;

  return (
    <section className="p-6 flex flex-col h-full">
      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-400/25">
              <CalendarHeart className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.officialHolidays}</h1>
              <p className="text-sm text-slate-600">{t.managePublicHolidays}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Expand/Collapse button */}
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`h-10 w-10 rounded-xl border transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 ${
                isExpanded
                  ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/35 ring-2 ring-cyan-200/60"
                  : "bg-gradient-to-br from-white to-slate-50 text-slate-700 border-slate-300 shadow-sm hover:shadow-md hover:border-cyan-400 hover:text-cyan-700"
              }`}
              aria-label={isExpanded ? "Collapse view" : "Expand view"}
              title={isExpanded ? "Collapse view" : "Expand view"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Year navigation */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-white rounded-lg h-9 w-9 p-0"
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous year"
            >
              <ChevronLeft className="text-slate-600" size={18} />
            </Button>
            <span className="text-sm font-semibold text-slate-700 min-w-[80px] text-center">{year}</span>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-white rounded-lg h-9 w-9 p-0"
              onClick={() => setYear((y) => y + 1)}
              aria-label="Next year"
            >
              <ChevronRight className="text-slate-600" size={18} />
            </Button>
          </div>
          </div>
        </div>

        {/* Stats */}
        {!isExpanded && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                <Calendar size={16} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">{t.totalHolidaysLabel}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                <CalendarCheck size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.upcoming}</p>
                <p className="text-xs text-emerald-600">{t.upcoming}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                <CalendarClock size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.past}</p>
                <p className="text-xs text-amber-600">{t.past}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-200 flex items-center justify-center">
                <CalendarHeart size={16} className="text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-700 truncate max-w-[120px]" title={stats.nextHoliday?.title ?? undefined}>
                  {stats.nextHoliday?.title || "—"}
                </p>
                <p className="text-xs text-rose-600">{t.nextHoliday}</p>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Table */}
      <section className="overflow-y-auto rounded-xl flex-1 bg-white border border-slate-200 shadow-sm custom-scrollbar">
        {sortedHolidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <CalendarDays size={48} className="text-slate-400 mb-3" aria-hidden="true" />
            <p className="text-lg font-semibold text-slate-700">{t.noHolidaysFound}</p>
            <p className="text-sm text-slate-500 font-medium">{t.addHolidayToStart}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3 font-bold w-16 bg-slate-100">#</th>
                <th className="px-4 py-3 font-bold bg-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSort("date")}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                  >
                    {t.date} {getSortIcon("date")}
                  </button>
                </th>
                <th className="px-4 py-3 font-bold bg-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSort("title")}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                  >
                    {t.holidayName} {getSortIcon("title")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedHolidays.map((h, index) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-500" />
                      <span className="text-slate-800 font-semibold">{formatToDayMonth(h.date)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-800 font-medium">{h.title}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}

