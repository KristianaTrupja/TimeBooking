import { SaveWorkHoursHandler, UseSaveWorkHoursParams } from "@/types/workDay";

export function useSaveWorkHours({
    date,
    userId,
    projectKey,
    reloadWorkHours,
    setWorkHoursForProject,
    month,
    year,
  }: UseSaveWorkHoursParams): SaveWorkHoursHandler {
    const projectId = parseInt(projectKey.split("-")[1], 10);
    const isoDate = new Date(`${date}T00:00:00Z`).toISOString();
  
    return async (hours: number, note: string) => {
      await setWorkHoursForProject(date, userId, projectKey, hours, note);
      await fetch("/api/workhours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: isoDate,
          hours,
          note,
          userId: parseInt(userId, 10),
          projectId,
        }),
      });
      reloadWorkHours(userId, month + 1, year);
    };
  }
  