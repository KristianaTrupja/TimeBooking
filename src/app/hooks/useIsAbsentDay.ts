import { Absence } from "@/types/absence";

export function useIsAbsentDay(absences: Absence[], date: string): {
  isAbsentDay: boolean;
  absenceType: string | null;
} {
  const current = new Date(date);

  const absence = absences.find((absence) => {
    const start = new Date(absence.startDate);
    const end = new Date(absence.endDate);
    return current >= start && current <= end;
  });

  return {
    isAbsentDay: Boolean(absence),
    absenceType: absence?.type ?? null,
  };
}
