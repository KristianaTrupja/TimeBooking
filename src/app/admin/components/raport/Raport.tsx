import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, Users } from "lucide-react";

import Spinner from "@/components/ui/Spinner";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import MonthYearPicker from "@/app/developer/components/monthYear/MonthYearPicker";
import RaportEntry from "./RaportEntry";
import { useTimeSheet } from "@/app/context/TimeSheetContext";
import { SubmissionStatus } from "@/types/timesheet";

export default function Raport() {
  const { loading } = useWorkHours();
  const { timesheets, fetchTimesheets, updateTimesheetStatus } = useTimeSheet()
  const { year, month, goToPreviousMonth, goToNextMonth, setMonthAndYear } = useCalendar();
  const searchParams = useSearchParams();
  const [scrollToUserId, setScrollToUserId] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasProcessedParams, setHasProcessedParams] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const calculateHeight = useCallback(() => {
    if (sectionRef.current && navRef.current) {
      const sectionTop = sectionRef.current.getBoundingClientRect().top;
      const navStyles = window.getComputedStyle(navRef.current);
      const navHeight = navRef.current.offsetHeight + 
        parseFloat(navStyles.marginTop) + parseFloat(navStyles.marginBottom);
      const bottomPadding = 24;
      const availableHeight = window.innerHeight - sectionTop - navHeight - bottomPadding;
      setContainerHeight(Math.max(availableHeight, 200));
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [calculateHeight]);

  // Check if we need to navigate to a different month/year from URL params (only on initial load)
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const needsNavigation = !hasProcessedParams && monthParam && yearParam && 
    (parseInt(monthParam) - 1 !== month || parseInt(yearParam) !== year);

  // Handle URL params for scrolling to employee row and navigating to correct month/year
  useEffect(() => {
    // Only process URL params once
    if (hasProcessedParams) return;

    const highlightParam = searchParams.get("highlightUserId");

    // Navigate to the correct month/year if provided
    if (monthParam && yearParam) {
      const targetMonth = parseInt(monthParam) - 1; // Convert to 0-indexed
      const targetYear = parseInt(yearParam);
      if (targetMonth !== month || targetYear !== year) {
        setIsNavigating(true);
        setMonthAndYear(targetMonth, targetYear);
      } else {
        setIsNavigating(false);
        setHasProcessedParams(true);
        // Set scroll target after navigation is complete
        if (highlightParam) {
          setScrollToUserId(parseInt(highlightParam));
        }
      }
    } else {
      setHasProcessedParams(true);
      // Set scroll target if no navigation needed
      if (highlightParam) {
        setScrollToUserId(parseInt(highlightParam));
      }
    }
  }, [searchParams, month, year, hasProcessedParams]);

  // Mark params as processed once we've reached the target month/year
  useEffect(() => {
    if (isNavigating && monthParam && yearParam) {
      const targetMonth = parseInt(monthParam) - 1;
      const targetYear = parseInt(yearParam);
      if (targetMonth === month && targetYear === year) {
        setIsNavigating(false);
        setHasProcessedParams(true);
        // Set scroll target after navigation is complete
        const highlightParam = searchParams.get("highlightUserId");
        if (highlightParam) {
          setScrollToUserId(parseInt(highlightParam));
        }
      }
    }
  }, [month, year, isNavigating, monthParam, yearParam, searchParams]);

  // Clear scroll target after it's been processed
  const handleScrollComplete = useCallback(() => {
    setScrollToUserId(null);
  }, []);

  useEffect(() => {
    fetchTimesheets(month, year)
  }, [year, month]);

  const formattedDate = useMemo(() => {
    return new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }, [year, month]);

  async function handleSubmissionStatusUpdate(submissionId:number, status: keyof typeof SubmissionStatus){
    try {
      await updateTimesheetStatus(submissionId, status)
      await fetchTimesheets(month, year)
    } catch (error) {
      console.log(error)
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    if (!timesheets) return { total: 0, pending: 0, approved: 0, totalHours: 0 };
    return {
      total: timesheets.length,
      pending: timesheets.filter(t => t.status === "PENDING").length,
      approved: timesheets.filter(t => t.status === "APPROVED").length,
      totalHours: timesheets.reduce((acc, t) => acc + t.totalHours, 0)
    };
  }, [timesheets]);

  return (
    <section ref={sectionRef} className="p-6 h-full flex flex-col">
      {/* Header Section */}
      <div ref={navRef} className="mb-6">
        {/* Title and Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Timesheets</h1>
              <p className="text-sm text-slate-500">Review and manage employee submissions</p>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-white rounded-lg h-9 w-9 p-0" 
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="text-slate-600" size={18} />
            </Button>
            <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center">{formattedDate}</span>
            <MonthYearPicker />
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-white rounded-lg h-9 w-9 p-0" 
              onClick={goToNextMonth}
            >
              <ChevronRight className="text-slate-600" size={18} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                <Users size={16} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Employees</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                <p className="text-xs text-amber-600">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
                <p className="text-xs text-emerald-600">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center">
                <FileText size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.totalHours.toFixed(0)}</p>
                <p className="text-xs text-blue-600">Total Hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <section
        className="overflow-hidden overflow-y-auto rounded-xl flex-1 bg-white border border-slate-200 shadow-sm custom-scrollbar"
        style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
      >
        {timesheets === null || loading || needsNavigation || isNavigating ? (
          <div className="h-64">
            <Spinner text="Loading timesheets..." />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-20">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3 font-bold w-16 bg-slate-100">#</th>
                <th className="px-4 py-3 font-bold bg-slate-100">Employee</th>
                <th className="px-4 py-3 font-bold bg-slate-100">Hours</th>
                <th className="px-4 py-3 font-bold bg-slate-100">Details</th>
                <th className="px-4 py-3 font-bold bg-slate-100">Status</th>
                <th className="px-4 py-3 font-bold bg-slate-100">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timesheets.map((ts, index: number) => (
                <RaportEntry
                  timesheet={ts}
                  month={month}
                  year={year}
                  index={index}
                  onApply={handleSubmissionStatusUpdate}
                  shouldScrollTo={scrollToUserId === ts.userId}
                  onScrollComplete={handleScrollComplete}
                  key={index}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
