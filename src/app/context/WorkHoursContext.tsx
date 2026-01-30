"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { normalizeProjectKey } from "../utils/normalizeProjectKey";
import { WorkHours } from "@/types/workDay";
import { MonthlyTimesheet, Submission } from "@/types/timesheet";
import { toast } from "sonner";

type WorkHoursContextType = {
  workHours: WorkHours;
  activeTimesheet: Submission | null
  metadata: {totalHours: number,isLocked: boolean,canEdit: boolean} | null
  submitTimesheet: (month:number, year:number, employeeId:string) => Promise<string>
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
  const [activeTimesheet, setActiveTimesheet] = useState<Submission | null>(null)
  const [metadata, setMetadata] = useState<{totalHours: number,isLocked: boolean,canEdit: boolean} | null>(null)
  const [loading, setLoading] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchWorkHours = useCallback(
    async (userId: string, month?: number, year?: number) => {
      if (!userId) {
        console.error("fetchWorkHours: userId is required");
        return;
      }

      // Abort any in-flight request before starting a new one
      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;
      
      try {
        setLoading(true);
        
        const params = new URLSearchParams({ userId });
        if (month && year) {
          params.append("month", month.toString());
          params.append("year", year.toString());
        }

        const res = await fetch(`/api/workhours?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(
            `Failed to fetch work hours: ${res.status} ${res.statusText}`
          );
        }

        const data: MonthlyTimesheet = await res.json();
        
        setActiveTimesheet(data.submission);
        setMetadata(data.metadata);

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

        setWorkHours(transformed);
        
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Error fetching work hours:", error);
        
        // Optionally: Set error state for UI feedback
        // setError(error instanceof Error ? error.message : "Unknown error");
        
      } finally {
        setLoading(false);
      }
    }, [])


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
  }

  async function submitTimesheet(month: number, year: number, employeeId:string): Promise<string> {
    const response = await fetch(`/api/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ month: month +1, year, employeeId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as { message: string; submission: Submission };
    setActiveTimesheet(data.submission);
    setMetadata(prev => prev ? { ...prev, isLocked: true, canEdit: false } : null);
    toast.success(data.message || "Timesheet Submitted!")
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
        setWorkHours((prev) => {
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

      setWorkHours((prev) => ({
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
  }


  const getTotalHoursForDay = (date: string, userId: string): number => {
    const userData = workHours[date]?.[userId];
    if (!userData) return 0;
    return Object.values(userData).reduce((sum, { hours }) => sum + hours, 0);
  }

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
  }

  const reloadWorkHours = useCallback(
    async (userId: string, month?: number, year?: number) => {
      await fetchWorkHours(userId, month, year);
    },
    [fetchWorkHours]
  )

  return (
    <WorkHoursContext.Provider
      value={{
        workHours,
        activeTimesheet,
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
