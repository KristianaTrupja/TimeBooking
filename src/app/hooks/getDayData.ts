import { WorkHours, WorkEntry } from "@/types/workDay";

export function getDayData(
  workHours: WorkHours,
  date: string,
  userId: string,
  projectKey: string
): WorkEntry {
  const key = projectKey.toLowerCase().replace(/\s+/g, "-");
  return workHours[date]?.[userId]?.[key] ?? { hours: 0, note: "" };
}
