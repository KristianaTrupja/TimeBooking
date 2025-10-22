import React, { useEffect, useMemo } from "react";
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
    <section>
      {/* Month Navigation Bar */}
      <div className="flex items-center justify-center gap-5 mb-4 px-4">
        <Button variant="ghost" className="border border-accent" onClick={goToPreviousMonth}>
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-bold text-[#244B77]">{formattedDate}</h2>
        <MonthYearPicker />
        <Button variant="ghost" className="border border-accent" onClick={goToNextMonth}>
          <ChevronRight />
        </Button>
      </div>
    <section className="overflow-hidden overflow-y-auto max-h-[450px] 2xl:max-h-[700px] pb-10 rounded-md">
      {/* Report Table */}
      {timesheets === null || loading ?  <Spinner /> : 
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
          {timesheets.map((ts, index: any) => <RaportEntry timesheet={ts} month={month} year={year} onApply={handleSubmissionStatusUpdate} key={index}/>)}
        </tbody>
      </table>}
    </section>
    </section>
  );
}
