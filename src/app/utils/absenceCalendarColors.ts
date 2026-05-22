export const ABSENCE_TYPE_ORDER = [
  "VACATION",
  "OFFICIAL_HOLIDAYS",
  "SICK",
  "HOME_OFFICE",
  "OTHER",
] as const;

type CalendarAbsenceType = (typeof ABSENCE_TYPE_ORDER)[number];

type AbsenceColorConfig = {
  legendChipClass: string;
  leaveCellClass: string;
  workhourCellClass: string;
  workhourTopBarClass: string;
  workhourBottomBarBgClass: string;
  workhourBottomBarBorderClass: string;
};

const DEFAULT_ABSENCE_COLOR: AbsenceColorConfig = {
  legendChipClass: "bg-blue-100 text-blue-800 border border-blue-300",
  leaveCellClass: "bg-blue-100 text-blue-800 font-semibold border-r border-blue-300",
  workhourCellClass: "bg-blue-100 text-blue-800",
  workhourTopBarClass: "!bg-blue-500/40 !text-blue-100",
  workhourBottomBarBgClass: "bg-blue-100 text-blue-800",
  workhourBottomBarBorderClass: "border-blue-500",
};

const ABSENCE_COLORS: Record<CalendarAbsenceType, AbsenceColorConfig> = {
  VACATION: {
    legendChipClass: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    leaveCellClass: "bg-emerald-100 text-emerald-800 font-semibold border-r border-emerald-300",
    workhourCellClass: "bg-emerald-100 text-emerald-800",
    workhourTopBarClass: "!bg-emerald-500/40 !text-emerald-100",
    workhourBottomBarBgClass: "bg-emerald-100 text-emerald-800",
    workhourBottomBarBorderClass: "border-emerald-500",
  },
  OFFICIAL_HOLIDAYS: {
    legendChipClass: "bg-cyan-100 text-cyan-800 border border-cyan-300",
    leaveCellClass: "bg-cyan-100 text-cyan-800 font-semibold border-r border-cyan-300",
    workhourCellClass: "bg-cyan-100 text-cyan-800",
    workhourTopBarClass: "!bg-cyan-500/40 !text-cyan-100",
    workhourBottomBarBgClass: "bg-cyan-100 text-cyan-800",
    workhourBottomBarBorderClass: "border-cyan-500",
  },
  SICK: {
    legendChipClass: "bg-red-100 text-red-800 border border-red-300",
    leaveCellClass: "bg-red-100 text-red-800 font-semibold border-r border-red-300",
    workhourCellClass: "bg-red-100 text-red-800",
    workhourTopBarClass: "!bg-red-500/40 !text-red-100",
    workhourBottomBarBgClass: "bg-red-100 text-red-800",
    workhourBottomBarBorderClass: "border-red-500",
  },
  HOME_OFFICE: {
    legendChipClass: "bg-violet-100 text-violet-800 border border-violet-300",
    leaveCellClass: "bg-violet-100 text-violet-800 font-semibold border-r border-violet-300",
    workhourCellClass: "bg-violet-100 text-violet-800",
    workhourTopBarClass: "!bg-violet-500/40 !text-violet-100",
    workhourBottomBarBgClass: "bg-violet-100 text-violet-800",
    workhourBottomBarBorderClass: "border-violet-500",
  },
  OTHER: {
    legendChipClass: "bg-indigo-100 text-indigo-800 border border-indigo-300",
    leaveCellClass: "bg-indigo-100 text-indigo-800 font-semibold border-r border-indigo-300",
    workhourCellClass: "bg-indigo-100 text-indigo-800",
    workhourTopBarClass: "!bg-indigo-500/40 !text-indigo-100",
    workhourBottomBarBgClass: "bg-indigo-100 text-indigo-800",
    workhourBottomBarBorderClass: "border-indigo-500",
  },
};

export const HOLIDAY_CALENDAR_COLORS = {
  legendChipClass: "bg-cyan-100 text-cyan-800 border border-cyan-300",
  leaveCellClass: "bg-cyan-100 text-cyan-800 border-r border-cyan-300",
  workhourCellClass: "bg-cyan-100 text-cyan-800",
  workhourTopBarClass: "!bg-cyan-500/40 !text-cyan-100",
  workhourBottomBarBgClass: "bg-cyan-100 text-cyan-800",
  workhourBottomBarBorderClass: "border-cyan-500",
};

export const WEEKEND_CALENDAR_COLORS = {
  legendChipClass: "bg-slate-100 text-slate-700 border border-slate-300",
  leaveCellClass: "bg-slate-100 text-slate-700 border-r border-slate-300",
  workhourCellClass: "bg-slate-200/80 text-slate-700",
  workhourBottomBarBgClass: "bg-slate-200 text-slate-700",
  workhourBottomBarBorderClass: "border-slate-500",
};

export const PENDING_CALENDAR_COLORS = {
  legendChipClass: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  leaveCellClass: "bg-yellow-100 text-yellow-800 font-semibold border-r border-yellow-300",
};

export const PENDING_UNSAVED_CALENDAR_COLORS = {
  legendChipClass: "bg-blue-100 text-blue-800 border border-blue-300",
};

export function normalizeAbsenceType(absenceType: string | null | undefined): string | null {
  if (!absenceType) return null;
  return absenceType.startsWith("PENDING_")
    ? absenceType.slice("PENDING_".length)
    : absenceType;
}

export function getAbsenceColorConfig(absenceType: string | null | undefined): AbsenceColorConfig {
  const normalized = normalizeAbsenceType(absenceType);
  if (!normalized) return DEFAULT_ABSENCE_COLOR;
  return ABSENCE_COLORS[normalized as CalendarAbsenceType] ?? DEFAULT_ABSENCE_COLOR;
}
