'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/app/context/CalendarContext";
import { useEffect, useMemo, useState } from "react";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { usePathname, useSearchParams } from "next/navigation";
import WorkStatus from "../status/workStatus";
import MonthYearPicker from "../monthYear/MonthYearPicker";
import { useProjects } from "@/app/context/ProjectContext";
import { Button } from "@/components/ui/button";

const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
    <div className="border rounded shadow px-4 py-2 bg-white flex items-center space-x-2">
      <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
      <span className="text-gray-700 text-sm">Loading in progress</span>
    </div>
  </div>
);

export default function SidebarHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  const userId = useMemo(() => {
    const segments = pathname.split("/");
    return segments[2];
  }, [pathname]);

  // Memoized search params parsing
  const { passedMonth, passedYear } = useMemo(() => {
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);
    return { passedMonth: month, passedYear: year };
  }, [searchParams]);

  const { year, month, goToNextMonth, goToPreviousMonth, setMonthAndYear, loading } = useCalendar();
  const { reloadWorkHours, activeTimesheet } = useWorkHours();
  const { loadingProjects } = useProjects();

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

  return (
    <div className="flex justify-between mt-4 relative">
      <div className="w-64 flex items-center justify-between relative min-h-6">
        {loading || loadingProjects && isInitialized && <LoadingSpinner />}
        {!loadingProjects && isInitialized && (
          <>
            <Button variant="ghost" onClick={goToPreviousMonth}>
              <ChevronLeft className="text-[#244B77]" />
            </Button>
            <p className="text-[#244B77] font-semibold text-center text-lg">
              {formattedDate}
            </p>
            <MonthYearPicker />
            <Button variant="ghost" onClick={goToNextMonth}>
              <ChevronRight className="text-[#244B77]" />
            </Button>
          </>
        )}
      </div>
      <div className="flex">
        <WorkStatus />
        <div className={`TimesheetStatus capitalize flex justify-center items-center text-sm font-bold px-2 py-1 rounded-md m-2 
          ${activeTimesheet?.status == "PENDING" ? "text-yellow-600 bg-yellow-100" : activeTimesheet?.status == "REJECTED" ? "text-red-500 bg-red-100" : activeTimesheet?.status == "APPROVED" ? "text-green-600 bg-green-100" : "text-gray-500 bg-white border"}`
          }>{activeTimesheet ? activeTimesheet.status : "DRAFT"}</div>
      </div>
    </div>
  )
}
