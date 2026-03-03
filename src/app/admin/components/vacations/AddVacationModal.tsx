import { Modal } from "@/app/components/ui/Modal";
import { CalendarPlus, Tag, Plus } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: { date: string; holiday: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSubmit: () => void;
  isLoading?: boolean;
};

export default function AddVacationModal({ isOpen, onClose, data, onChange, onSubmit, isLoading }: Props) {
  const { t } = useLanguage();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-slate-700 text-white">
          <CalendarPlus size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{t.addNewHoliday}</h2>
          <p className="text-sm text-slate-500">{t.createHolidayEntry}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Date Input */}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.date}</label>
          <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-colors">
            <input
              type="date"
              className="block w-full max-w-full min-w-0 px-3 sm:px-4 py-2.5 bg-transparent text-base sm:text-sm text-slate-700 focus:outline-none"
              value={data.date}
              onChange={(e) => onChange(e, "date")}
            />
          </div>
        </div>

        {/* Holiday Name Input */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">{t.holidayName}</label>
          <div className="relative">
            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="e.g., Christmas Day"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors placeholder:text-slate-400"
              value={data.holiday}
              onChange={(e) => onChange(e, "holiday")}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin size-[18px]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Plus size={18} />
          )}
          {isLoading ? t.adding : t.addHoliday}
        </button>
      </div>
    </Modal>
  );
}
