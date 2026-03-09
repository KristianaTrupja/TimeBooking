import { Absence } from "@/types/absence";

export function useIsAbsentDay(absences: Absence[], date: string): {
  isAbsentDay: boolean;
  absenceType: string | null;
} {
  const current = new Date(date);
  
  // Check if the day is a weekend (Saturday = 6, Sunday = 0)
  const dayOfWeek = current.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Weekends should not be marked as absent days
  if (isWeekend) {
    return {
      isAbsentDay: false,
      absenceType: null,
    };
  }

  const absence = absences.find((absence) => {
    if (absence.status && absence.status !== "APPROVED") {
      return false;
    }
    const start = new Date(absence.startDate);
    const end = new Date(absence.endDate);
    return current >= start && current <= end;
  });

  return {
    isAbsentDay: Boolean(absence),
    absenceType: absence?.type ?? null,
  };
}
