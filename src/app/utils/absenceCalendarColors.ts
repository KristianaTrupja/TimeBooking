export const ABSENCE_TYPE_ORDER = [
  "VACATION",
  "SICK",
  "PERSONAL",
  "PARENTAL",
  "MARRIAGE",
  "BEREAVEMENT",
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
  legendChipClass: "bg-blue-50 text-blue-700 border border-blue-200",
  leaveCellClass: "bg-blue-100 text-blue-800 font-semibold border-r border-blue-200",
  workhourCellClass: "bg-blue-100 text-blue-700",
  workhourTopBarClass: "!bg-blue-500/30 !text-blue-200",
  workhourBottomBarBgClass: "bg-blue-100 text-blue-700",
  workhourBottomBarBorderClass: "border-blue-400",
};

const ABSENCE_COLORS: Record<CalendarAbsenceType, AbsenceColorConfig> = {
  VACATION: {
    legendChipClass: "bg-teal-50 text-teal-700 border border-teal-200",
    leaveCellClass: "bg-teal-100 text-teal-800 font-semibold border-r border-teal-200",
    workhourCellClass: "bg-teal-100 text-teal-700",
    workhourTopBarClass: "!bg-teal-500/30 !text-teal-200",
    workhourBottomBarBgClass: "bg-teal-100 text-teal-700",
    workhourBottomBarBorderClass: "border-teal-400",
  },
  SICK: {
    legendChipClass: "bg-rose-50 text-rose-700 border border-rose-200",
    leaveCellClass: "bg-rose-100 text-rose-800 font-semibold border-r border-rose-200",
    workhourCellClass: "bg-rose-100 text-rose-700",
    workhourTopBarClass: "!bg-rose-500/30 !text-rose-200",
    workhourBottomBarBgClass: "bg-rose-100 text-rose-700",
    workhourBottomBarBorderClass: "border-rose-400",
  },
  PERSONAL: {
    legendChipClass: "bg-violet-50 text-violet-700 border border-violet-200",
    leaveCellClass: "bg-violet-100 text-violet-800 font-semibold border-r border-violet-200",
    workhourCellClass: "bg-violet-100 text-violet-700",
    workhourTopBarClass: "!bg-violet-500/30 !text-violet-200",
    workhourBottomBarBgClass: "bg-violet-100 text-violet-700",
    workhourBottomBarBorderClass: "border-violet-400",
  },
  PARENTAL: {
    legendChipClass: "bg-amber-50 text-amber-700 border border-amber-200",
    leaveCellClass: "bg-amber-100 text-amber-800 font-semibold border-r border-amber-200",
    workhourCellClass: "bg-amber-100 text-amber-700",
    workhourTopBarClass: "!bg-amber-500/30 !text-amber-200",
    workhourBottomBarBgClass: "bg-amber-100 text-amber-700",
    workhourBottomBarBorderClass: "border-amber-400",
  },
  MARRIAGE: {
    legendChipClass: "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200",
    leaveCellClass: "bg-fuchsia-100 text-fuchsia-800 font-semibold border-r border-fuchsia-200",
    workhourCellClass: "bg-fuchsia-100 text-fuchsia-700",
    workhourTopBarClass: "!bg-fuchsia-500/30 !text-fuchsia-200",
    workhourBottomBarBgClass: "bg-fuchsia-100 text-fuchsia-700",
    workhourBottomBarBorderClass: "border-fuchsia-400",
  },
  BEREAVEMENT: {
    legendChipClass: "bg-slate-100 text-slate-700 border border-slate-200",
    leaveCellClass: "bg-slate-200 text-slate-800 font-semibold border-r border-slate-300",
    workhourCellClass: "bg-slate-200 text-slate-700",
    workhourTopBarClass: "!bg-slate-500/30 !text-slate-200",
    workhourBottomBarBgClass: "bg-slate-200 text-slate-700",
    workhourBottomBarBorderClass: "border-slate-400",
  },
};

export const HOLIDAY_CALENDAR_COLORS = {
  legendChipClass: "bg-sky-50 text-sky-700 border border-sky-200",
  leaveCellClass: "bg-sky-50 text-sky-700 border-r border-sky-200",
  workhourCellClass: "bg-sky-50 text-sky-700",
  workhourTopBarClass: "!bg-sky-500/30 !text-sky-100",
  workhourBottomBarBgClass: "bg-sky-50 text-sky-700",
  workhourBottomBarBorderClass: "border-sky-300",
};

export const WEEKEND_CALENDAR_COLORS = {
  legendChipClass: "bg-slate-50 text-slate-600 border border-slate-200",
  leaveCellClass: "bg-slate-50 text-slate-400 border-r border-slate-100",
  workhourCellClass: "bg-slate-100/70 text-slate-500",
  workhourBottomBarBgClass: "bg-slate-100 text-slate-500",
  workhourBottomBarBorderClass: "border-slate-400",
};

export const PENDING_CALENDAR_COLORS = {
  legendChipClass: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  leaveCellClass: "bg-yellow-100 text-yellow-800 font-semibold border-r border-yellow-200",
};

export const PENDING_UNSAVED_CALENDAR_COLORS = {
  legendChipClass: "bg-blue-50 text-blue-700 border border-blue-200",
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
