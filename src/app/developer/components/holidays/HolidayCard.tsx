import { Calendar } from "lucide-react";

type Props = {
  holiday: { id: number; date: string; title: string };
  index: number;
  formatToDayMonth: (dateStr: string) => string;
};

export default function HolidayCard({ holiday, index, formatToDayMonth }: Props) {
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-200 to-blue-300 flex items-center justify-center">
            <Calendar size={18} className="text-blue-700" />
          </div>
          <span className="font-bold text-base text-slate-900">{holiday.title}</span>
        </div>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          {index + 1}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-slate-500" />
        <span className="text-xs font-semibold uppercase text-slate-500">Date:</span>
        <span className="text-slate-800 font-semibold ml-auto">{formatToDayMonth(holiday.date)}</span>
      </div>
    </div>
  );
}
