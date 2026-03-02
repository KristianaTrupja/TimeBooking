'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/app/context/CalendarContext";
import { useEffect, useMemo, useState } from "react";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { useSearchParams } from "next/navigation";
import WorkStatus from "../status/workStatus";
import MonthYearPicker from "../monthYear/MonthYearPicker";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/context/LanguageContext";

export default function SidebarHeader() {
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);
  const { t, language } = useLanguage();

  // Memoized search params parsing
  const { passedMonth, passedYear } = useMemo(() => {
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);
    return { passedMonth: month, passedYear: year };
  }, [searchParams]);

  const { year, month, goToNextMonth, goToPreviousMonth, setMonthAndYear } = useCalendar();
  const { activeTimesheet } = useWorkHours();

  // Memoized formatted date with language support
  const formattedDate = useMemo(() => {
    return new Date(year, month).toLocaleString(language === "de" ? "de-DE" : "en-US", {
      month: "long",
      year: "numeric",
    });
  }, [year, month, language]);

  const formattedDateShort = useMemo(() => {
    return new Date(year, month).toLocaleString(language === "de" ? "de-DE" : "en-US", {
      month: "short",
      year: "numeric",
    });
  }, [year, month, language]);
  
  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case "PENDING": return t.pending;
      case "REJECTED": return t.rejected;
      case "APPROVED": return t.approved;
      case "LOCKED": return t.locked;
      default: return t.draft;
    }
  };

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
        return "text-sky-700 bg-sky-50 border-sky-200";
    }
  };

  return (
    <div className="flex justify-between mb-4 relative">
      <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 rounded-xl p-0.5 sm:p-1 shadow-sm border border-slate-200 relative">
        {isInitialized && (
          <>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={goToPreviousMonth}
              className="hover:bg-white rounded-lg !min-w-8 !min-h-8 h-8 w-8 sm:!min-w-9 sm:!min-h-9 sm:h-9 sm:w-9 p-0"
            >
              <ChevronLeft className="text-slate-600" size={16} />
            </Button>
            <span className="text-sm font-semibold text-slate-700 min-w-[64px] sm:min-w-[100px] md:min-w-[140px] text-center">
              <span className="md:hidden">{formattedDateShort}</span>
              <span className="hidden md:inline">{formattedDate}</span>
            </span>
            <MonthYearPicker />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={goToNextMonth}
              className="hover:bg-white rounded-lg !min-w-8 !min-h-8 h-8 w-8 sm:!min-w-9 sm:!min-h-9 sm:h-9 sm:w-9 p-0"
            >
              <ChevronRight className="text-slate-600" size={16} />
            </Button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <WorkStatus />
        <div className={`flex justify-center items-center text-xs font-semibold px-3 py-1.5 rounded-lg border ${getStatusStyle(activeTimesheet?.status)}`}>
          {getStatusLabel(activeTimesheet?.status)}
        </div>
      </div>
    </div>
  )
}
