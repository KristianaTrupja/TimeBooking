'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/app/context/CalendarContext";
import { useEffect, useMemo } from "react";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { usePathname } from "next/navigation";
import WorkStatus from "../status/workStatus";

export default function SidebarHeader() {
  const pathname = usePathname();
  const userId = useMemo(() => {
    const segments = pathname.split("/");
    return segments[2];
  }, [pathname]);

  const { year, month, goToNextMonth, goToPreviousMonth, loading, } = useCalendar();
  const { reloadWorkHours } = useWorkHours();

  useEffect(() => {
    if (userId) {
      reloadWorkHours(userId, month + 1, year);
    }
  }, [userId, month, year]);

  const formattedDate = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex justify-between mt-4 relative"> {/* Added relative for loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <div className="border rounded shadow px-4 py-2 bg-white flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 text-sm">Loading in progress</span>
          </div>
        </div>
      )}
      <div className="w-64 flex items-center justify-between">
        <button className="cursor-pointer" onClick={goToPreviousMonth}>
          <ChevronLeft className="text-[#244B77]" />
        </button>
        <p className="text-[#244B77] font-semibold text-center min-w-[100px]">
          {formattedDate}
        </p>
        <button className="cursor-pointer" onClick={goToNextMonth}>
          <ChevronRight className="text-[#244B77]" />
        </button>
      </div>
      <WorkStatus />
    </div>
  );
}
