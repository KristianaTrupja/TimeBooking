"use client";

import React, { useMemo, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { useHolidayContext } from "@/app/context/HolidayContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

function toISODateOnly(d: Date) {
  return d.toISOString().split("T")[0];
}

type SortField = "date" | "holiday";
type SortDirection = "asc" | "desc";

export default function DeveloperHolidays() {
  const { t } = useLanguage();
  const [holidays, loading] = useHolidayContext();
  const [year, setYear] = useState(new Date().getFullYear());
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filtered = useMemo(() => {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const base = holidays
      .filter((h) => h.date >= start && h.date <= end)
      .slice();

    base.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortField === "date") {
        return a.date.localeCompare(b.date) * dir;
      }
      return a.title.localeCompare(b.title) * dir;
    });

    return base;
  }, [holidays, year, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="opacity-70" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="opacity-80" />
    ) : (
      <ArrowDown size={14} className="opacity-80" />
    );
  };

  const stats = useMemo(() => {
    const today = toISODateOnly(new Date());
    const upcoming = filtered.filter((h) => h.date >= today);
    const pastCount = filtered.length - upcoming.length;
    return {
      total: filtered.length,
      upcoming: upcoming.length,
      past: pastCount,
      next: upcoming[0] ?? null,
    };
  }, [filtered]);

  if (loading) return <Spinner text={t.loadingHolidays} />;

  return (
    <section className="p-6 flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <CalendarDays className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{t.holidays}</h1>
              <p className="text-sm text-slate-500">{t.managePublicHolidays}</p>
            </div>
          </div>

          {/* Year navigation */}
          <div className="flex items-center gap-2 bg-white rounded-xl px-2 py-1 shadow-sm border border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setYear((y) => y - 1)}
              className="hover:bg-slate-100 rounded-lg"
              aria-label="Previous year"
            >
              <ChevronLeft className="text-slate-600" size={20} />
            </Button>
            <div className="min-w-[96px] text-center text-slate-700 font-semibold">
              {year}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setYear((y) => y + 1)}
              className="hover:bg-slate-100 rounded-lg"
              aria-label="Next year"
            >
              <ChevronRight className="text-slate-600" size={20} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-xl">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                <Calendar size={16} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">{t.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                <CalendarDays size={16} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.upcoming}</p>
                <p className="text-xs text-emerald-700">{t.upcoming}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                <CalendarDays size={16} className="text-amber-800" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-800">{stats.past}</p>
                <p className="text-xs text-amber-800">{t.past}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <section className="overflow-y-auto rounded-xl flex-1 bg-white border border-slate-200 shadow-sm custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <CalendarDays className="text-slate-500" size={22} />
            </div>
            <p className="text-slate-800 font-semibold">{t.noHolidaysFound}</p>
            <p className="text-slate-500 text-sm mt-1">{t.addHolidayToStart}</p>
          </div>
        ) : (
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3 font-bold bg-slate-100" style={{ width: "160px" }}>
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
                    onClick={() => handleSort("holiday")}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                  >
                    {t.holiday} {getSortIcon("holiday")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                    {h.date}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{h.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}

