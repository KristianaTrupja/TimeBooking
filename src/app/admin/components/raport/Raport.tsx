import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  return (
    <section ref={sectionRef}>
      {/* Month Navigation Bar */}
      <div ref={navRef} className="flex items-center justify-center gap-5 mb-4 px-4">
        <Button variant="ghost" className="border border-accent" onClick={goToPreviousMonth}>
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-bold text-[#244B77]">{formattedDate}</h2>
        <MonthYearPicker />
        <Button variant="ghost" className="border border-accent" onClick={goToNextMonth}>
          <ChevronRight />
        </Button>
      </div>
    <section
      className="overflow-hidden overflow-y-auto pb-10 rounded-md"
      style={{ maxHeight: containerHeight ? `${containerHeight}px` : "66vh" }}
    >
      {/* Report Table */}
      {timesheets === null || loading || needsNavigation || isNavigating ?  <Spinner /> : 
      <table
        className="w-full text-[#244B77] border-separate"
        style={{ borderSpacing: "10px" }}
      >
        <thead className="bg-[#6C99CB] text-white">
          <tr className="text-left">
            <th className="px-4 py-2 w-16 rounded-sm">Nr</th>
            <th className="px-4 py-2 w-1/3 rounded-sm">Employee</th>
            <th className="px-4 py-2 w-1/3 rounded-sm">Working Hours ({formattedDate})</th>
            <th className="px-4 py-2 w-1/3 rounded-sm">Details</th>
            <th className="px-4 py-2 w-1/3 rounded-sm">Status</th>
            <th className="px-4 py-2 w-1/3 rounded-sm">Action</th>
          </tr>
        </thead>
        <tbody>
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
      </table>}
    </section>
    </section>
  );
}
