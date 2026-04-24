"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import {
  PENDING_UNSAVED_CALENDAR_COLORS,
  WEEKEND_CALENDAR_COLORS,
  getAbsenceColorConfig,
} from "@/app/utils/absenceCalendarColors";

export default function CalendarLegend() {
  const { t } = useLanguage();
  
  const legendItems = [
    { label: t.weekend, color: WEEKEND_CALENDAR_COLORS.legendChipClass },
    { label: t.vacation, color: getAbsenceColorConfig("VACATION").legendChipClass },
    { label: t.officialHolidays, color: getAbsenceColorConfig("OFFICIAL_HOLIDAYS").legendChipClass },
    { label: t.sick, color: getAbsenceColorConfig("SICK").legendChipClass },
    { label: t.other, color: getAbsenceColorConfig("OTHER").legendChipClass },
    { label: t.pendingUnsaved, color: PENDING_UNSAVED_CALENDAR_COLORS.legendChipClass },
  ];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{t.timereportingsStatus}</span>
      <div className="flex flex-wrap gap-1.5">
        {legendItems.map((item) => (
          <span
            key={item.label}
            title={item.label}
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium cursor-default ${item.color}`}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

