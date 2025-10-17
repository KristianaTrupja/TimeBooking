"use client";
import { SubmissionStatus, Timesheet, TimesheetAPIData } from "@/types/timesheet";
import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";

type TimeSheetContextType = {
  timesheets: Timesheet[] | null
  fetchTimesheets: (month:number, year:number) => void
  updateTimesheetStatus: (submissionId:number, status: keyof typeof SubmissionStatus) => Promise<void>
}

const TimeSheetContext = createContext<TimeSheetContextType | undefined>(undefined);

export const TimeSheetProvider = ({ children }: { children: ReactNode }) => {
    const [timesheets, setTimesheets] = useState<Timesheet[] | null>(null)

    async function fetchTimesheets(month:number, year:number) {
      setTimesheets(null)
      try {
        const response = await fetch(`/api/submissions?month=${month +1}&year=${year}`)
        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: TimesheetAPIData = await response.json()
        setTimesheets(data.timesheets)
      } catch (error) {
        setTimesheets([])
        console.log(error)
      }
    }

    async function updateTimesheetStatus(submissionId:number, status: keyof typeof SubmissionStatus){
      try {
        const res = await fetch(`/api/submissions?submissionId=${submissionId}`, { 
          method:"PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ status })
        })

      if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || `Failed to change status. Status: ${res.status}`);
      }        
      const updatedSubmission = await res.json()
      return updatedSubmission
      }
      catch(error){
        console.log(error)
      }
    }

  return (
    <TimeSheetContext.Provider value={{ timesheets, fetchTimesheets, updateTimesheetStatus }}>
      {children}
    </TimeSheetContext.Provider>
  );
};

export const useTimeSheet = (): TimeSheetContextType => {
  const context = useContext(TimeSheetContext);
  if (!context) {
    throw new Error("useTimeSheet must be used within a TimeSheetProvider");
  }
  return context;
};
