"use client";
import { Submission } from "@/types/submission";
import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";

type TimeSheetContextType = {
    submitTimesheet: (month:number, year:number) => Promise<void | Error>
}

const TimeSheetContext = createContext<TimeSheetContextType | undefined>(undefined);

export const TimeSheetProvider = ({ children }: { children: ReactNode }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([])

    async function submitTimesheet(month:number, year:number):Promise<void | Error> {
        const response = await fetch(`/api/submissions?month=${month}&year=${year}`, { method:"POST" })
        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
    }

  return (
    <TimeSheetContext.Provider value={{ submitTimesheet }}>
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
