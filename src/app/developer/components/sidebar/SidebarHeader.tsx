'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/app/context/CalendarContext";
import { useEffect, useMemo, useState } from "react";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { useSearchParams } from "next/navigation";
import WorkStatus from "../status/workStatus";
import MonthYearPicker from "../monthYear/MonthYearPicker";
import { Button } from "@/components/ui/button";

export default function SidebarHeader() {
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoized search params parsing
  const { passedMonth, passedYear } = useMemo(() => {
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);
    return { passedMonth: month, passedYear: year };
  }, [searchParams]);

  const { year, month, goToNextMonth, goToPreviousMonth, setMonthAndYear } = useCalendar();
  const { activeTimesheet } = useWorkHours();

  // Memoized formatted date
  const formattedDate = useMemo(() => {
    return new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }, [year, month]);

  useEffect(() => {
    if (!isNaN(passedMonth) && !isNaN(passedYear)) {
      setMonthAndYear(passedMonth - 1, passedYear);
    }
    setIsInitialized(true);
  }, [passedMonth, passedYear]);

  const getStatusStyle = (status: string | undefined) => {
    switch (status) {
      case "PENDING":
        return "text-amber-700 bg-amber-100 border-amber-200";
      case "REJECTED":
        return "text-rose-700 bg-rose-100 border-rose-200";
      case "APPROVED":
        return "text-emerald-700 bg-emerald-100 border-emerald-200";
      case "LOCKED":
        return "text-slate-700 bg-slate-100 border-slate-200";
      default:
        return "text-slate-500 bg-white border-slate-200";
    }
  };

  return (
    <div className="flex justify-between mb-4 relative">
      <div className="flex items-center gap-2 bg-white rounded-xl px-2 py-1 shadow-sm border border-slate-200 relative min-h-10">
        {isInitialized && (
          <>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={goToPreviousMonth}
              className="hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="text-slate-600" size={20} />
            </Button>
            <p className="text-slate-700 font-semibold text-center text-base min-w-[140px]">
              {formattedDate}
            </p>
            <MonthYearPicker />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={goToNextMonth}
              className="hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight className="text-slate-600" size={20} />
            </Button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <WorkStatus />
        <div className={`capitalize flex justify-center items-center text-xs font-semibold px-3 py-1.5 rounded-lg border ${getStatusStyle(activeTimesheet?.status)}`}>
          {activeTimesheet ? activeTimesheet.status : "DRAFT"}
        </div>
      </div>
    </div>
  )
}
