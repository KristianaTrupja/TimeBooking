"use client";

import { useLanguage } from "@/app/context/LanguageContext";

export default function CalendarLegend() {
  const { t } = useLanguage();
  
  const legendItems = [
    { label: t.weekend, color: "bg-slate-100" },
    { label: t.officialHoliday, color: "bg-emerald-100" },
    { label: t.vacationAbsence, color: "bg-amber-100" },
    { label: t.pendingUnsaved, color: "bg-blue-100" },
  ];

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{t.timereportingsStatus}</span>
      <div className="flex">
        {legendItems.map((item) => (
          <div
            key={item.label}
            title={item.label}
            className={`w-6 h-3 ${item.color} cursor-default hover:brightness-110 transition-all first:rounded-l last:rounded-r`}
          />
        ))}
      </div>
    </div>
  );
}

