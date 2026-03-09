import { ExtAbsence } from "@/types/absence";
import { Palmtree, Stethoscope, UserRound, Baby, Calendar, Clock } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  absence: ExtAbsence;
  index: number;
  formatDate: (dateStr: string) => string;
};

const leaveTypeStyles: Record<string, { icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string }> = {
  VACATION: { 
    icon: <Palmtree size={16} />, 
    bgColor: "bg-teal-100", 
    textColor: "text-teal-700", 
    borderColor: "border-teal-300" 
  },
  SICK: { 
    icon: <Stethoscope size={16} />, 
    bgColor: "bg-rose-100", 
    textColor: "text-rose-700", 
    borderColor: "border-rose-300" 
  },
  PERSONAL: { 
    icon: <UserRound size={16} />, 
    bgColor: "bg-violet-100", 
    textColor: "text-violet-700", 
    borderColor: "border-violet-300" 
  },
  PARENTAL: { 
    icon: <Baby size={16} />, 
    bgColor: "bg-amber-100", 
    textColor: "text-amber-700", 
    borderColor: "border-amber-300" 
  },
};

export default function AbsenceCard({ absence, index, formatDate }: Props) {
  const { t } = useLanguage();
  const style = leaveTypeStyles[absence.type] || leaveTypeStyles.VACATION;
  const statusClass =
    absence.status === "PENDING"
      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
      : absence.status === "REJECTED"
        ? "bg-rose-100 text-rose-700 border-rose-300"
        : "bg-emerald-100 text-emerald-700 border-emerald-300";

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${style.bgColor} ${style.textColor} ${style.borderColor}`}>
          {style.icon}
          {absence.type}
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold border ${statusClass}`}>
          {absence.status}
        </span>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
          {index + 1}
        </span>
      </div>

      {/* Start Date */}
      <div className="mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.startDate}</span>
        </div>
        <span className="text-slate-800 font-medium ml-0 sm:ml-6">{formatDate(absence.startDate)}</span>
      </div>

      {/* End Date */}
      <div className="mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.endDate}</span>
        </div>
        <span className="text-slate-800 font-medium ml-0 sm:ml-6">{formatDate(absence.endDate)}</span>
      </div>

      {/* Days */}
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-slate-500" />
        <span className="text-xs font-semibold uppercase text-slate-500">{t.days}:</span>
        <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg bg-slate-100 text-slate-800 font-bold text-sm ml-auto">
          {absence.days || "—"}
        </span>
      </div>
    </div>
  );
}
