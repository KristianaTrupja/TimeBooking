"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { normalizeProjectKey } from "../utils/normalizeProjectKey";
import { TimeSheetSubmission } from "@prisma/client";
import { Submission } from "@/types/submission";
import { WorkHours } from "@/types/workDay";

type MonthlyTimesheet = {
  submission: Submission | null;
  workhours: WorkHour[];
  metadata: {
    totalHours: number;
    isLocked: boolean;
    canEdit: boolean;
  };
}

type WorkHour = {
  id: number;
  date: string;
  hours: number;
  note: string | null;
  userId: number;
  projectId: number;
  submissionId: number | null;
  submission: TimeSheetSubmission | null;
}



type WorkHoursContextType = {
  workHours: WorkHours;
  timesheet: Submission | null
  metadata: {totalHours: number,isLocked: boolean,canEdit: boolean} | null
  submitTimesheet: (month:number, year:number) => Promise<string>
  setWorkHoursForProject: (
    date: string,
    userId: string,
    projectKey: string,
    hours: number,
    note?: string
  ) => Promise<void>;
  getTotalHoursForDay: (date: string, userId: string) => number;
  getTotalHoursForProjectInMonth: (
    userId: string,
    projectKey: string,
    month: number,
    year: number
  ) => number;
  getTotalHoursForUserInMonth: (
    userId: string,
    month: number,
    year: number
  ) => number;
  reloadWorkHours: (
    userId: string,
    month?: number,
    year?: number
  ) => Promise<void>;
  loading: boolean;
};

const WorkHoursContext = createContext<WorkHoursContextType | undefined>(
  undefined
);

export function WorkHoursProvider({ children }: { children: ReactNode }) {
  const [workHours, setWorkHours] = useState<WorkHours>({}); // [••4••]
  const [timesheet, setTimesheet] = useState<Submission | null>(null)
  const [metadata, setMetadata] = useState<{totalHours: number,isLocked: boolean,canEdit: boolean} | null>(null)
  const [loading, setLoading] = useState(false);

const fetchWorkHours = useCallback(
  async (userId: string, month?: number, year?: number) => {
    // Guard clause: validate required parameters
    if (!userId) {
      console.error("fetchWorkHours: userId is required");
      return;
    }

    console.log("EXECUTION ::: fetchWorkHours", { userId, month, year });

    // Create AbortController for cleanup and race condition handling
    const controller = new AbortController();
    
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({ userId });
      if (month && year) {
        params.append("month", month.toString());
        params.append("year", year.toString());
      }

      // Fetch with abort signal
      const res = await fetch(`/api/workhours?${params.toString()}`, {
        signal: controller.signal,
      });

      // Handle HTTP errors explicitly
      if (!res.ok) {
        throw new Error(
          `Failed to fetch work hours: ${res.status} ${res.statusText}`
        );
      }

      // Parse response
      const data: MonthlyTimesheet = await res.json();
      
      // Update submission and metadata states
      setTimesheet(data.submission);
      setMetadata(data.metadata);

      // Transform work hours data
      const transformed: WorkHours = {};

      for (const entry of data.workhours) {
        const dateStr = entry.date.split("T")[0];
        const userIdStr = String(entry.userId);
        const projectKey = `project-${entry.projectId}`;

        if (!transformed[dateStr]) {
          transformed[dateStr] = {};
        }
        if (!transformed[dateStr][userIdStr]) {
          transformed[dateStr][userIdStr] = {};
        }

        transformed[dateStr][userIdStr][projectKey] = {
          hours: entry.hours,
          note: entry.note,
        };
      }

      // CRITICAL FIX: Replace state instead of merging
      // This prevents accumulation of data from previous months
      setWorkHours(transformed);
      
    } catch (error) {
      // Handle abort errors gracefully (not actual errors)
      if (error instanceof Error && error.name === "AbortError") {
        console.log("fetchWorkHours: Request was cancelled");
        return;
      }

      // Handle other errors with specific messaging
      console.error("Error fetching work hours:", error);
      
      // Optionally: Set error state for UI feedback
      // setError(error instanceof Error ? error.message : "Unknown error");
      
    } finally {
      setLoading(false);
    }

    // Return cleanup function (though not directly used in useCallback)
    return () => controller.abort();
  },
  [] // Empty deps array is correct - state setters are stable
);


  const getTotalHoursForUserInMonth = (
    userId: string,
    month: number,
    year: number
  ): number => {
    let total = 0;
    for (const [dateStr, users] of Object.entries(workHours)) {
      const date = new Date(dateStr);
      if (date.getMonth() === month - 1 && date.getFullYear() === year) {
        const userData = users[userId];
        if (userData) {
          for (const entry of Object.values(userData)) {
            total += entry.hours;
          }
        }
      }
    }
    return total;
  };

  async function submitTimesheet(month: number, year: number): Promise<string> {
    const response = await fetch(`/api/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month: month +1, year }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as { message: string; submission: Submission };
    setTimesheet(data.submission);
    setMetadata(prev => prev ? { ...prev, isLocked: true, canEdit: false } : null);
    return data.message;
  }


  const setWorkHoursForProject = async (
    date: string,
    userId: string,
    projectKey: string,
    hours: number,
    note?: string
  ) => {
    const projectId = Number(projectKey.replace(/^PID-/, ""));
    const normalizedKey = normalizeProjectKey(projectKey);
    const userData = workHours[date]?.[userId];
    const entryExists = userData?.[normalizedKey] !== undefined;

    // If setting 0 hours
    if (hours === 0) {
      if (!entryExists) {
        alert("Cannot add 0 hours to an empty cell.");
        return;
      }

      // Delete from database
      try {
        const res = await fetch(
          `/api/workhours?date=${encodeURIComponent(date)}&userId=${userId}&projectId=${projectId}`,
          {
            method: "DELETE",
          }
        );
        if (!res.ok) {
          console.error("Failed to delete work hours", date, userId, normalizedKey);
          return;
        }
        // Remove from local state
        setWorkHours((prev) => { // [••5••]
          const updated = { ...prev };

          if (
            updated[date] &&
            updated[date][userId] &&
            updated[date][userId][normalizedKey]
          ) {
            delete updated[date][userId][normalizedKey];

            if (Object.keys(updated[date][userId]).length === 0) {
              delete updated[date][userId];
            }

            if (Object.keys(updated[date]).length === 0) {
              delete updated[date];
            }
          }

          return updated;
        });
      } catch (error) {
        console.error("Error deleting work hours:", error);
      }
      return;
    }

    // If hours > 0, POST or PUT
    const payload = {
      date,
      userId: Number(userId),
      projectId,
      hours,
      note: note ?? null,
    };

    const method = entryExists ? "PUT" : "POST";

    try {
      const res = await fetch("/api/workhours", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(`${method} work hours failed`);
        return;
      }

      setWorkHours((prev) => ({ // [••5••]
        ...prev,
        [date]: {
          ...prev[date],
          [userId]: {
            ...prev[date]?.[userId],
            [normalizedKey]: { hours, note },
          },
        },
      }));
    } catch (error) {
      console.error("Error saving work hours:", error);
    }
  };


  const getTotalHoursForDay = (date: string, userId: string): number => {
    const userData = workHours[date]?.[userId];
    if (!userData) return 0;
    return Object.values(userData).reduce((sum, { hours }) => sum + hours, 0);
  };

  const getTotalHoursForProjectInMonth = (
    userId: string,
    projectKey: string,
    month: number,
    year: number
  ): number => {
    let total = 0;
    const normalizedProjectKey = normalizeProjectKey(projectKey);
    for (const [dateStr, users] of Object.entries(workHours)) {
      const date = new Date(dateStr);
      if (date.getMonth() === month - 1 && date.getFullYear() === year) {
        total += users[userId]?.[normalizedProjectKey]?.hours ?? 0;
      }
    }
    return total;
  };

  const reloadWorkHours = useCallback(
    async (userId: string, month?: number, year?: number) => {
      await fetchWorkHours(userId, month, year);
    },
    [fetchWorkHours]
  );

  return (
    <WorkHoursContext.Provider
      value={{
        workHours,
        timesheet,
        metadata,
        setWorkHoursForProject,
        getTotalHoursForDay,
        getTotalHoursForProjectInMonth,
        getTotalHoursForUserInMonth,
        reloadWorkHours,
        submitTimesheet,
        loading,
      }}
    >
      {children}
    </WorkHoursContext.Provider>
  );
}

export function useWorkHours() {
  const context = useContext(WorkHoursContext);
  if (!context) {
    throw new Error("useWorkHours must be used within a WorkHoursProvider");
  }
  return context;
}
