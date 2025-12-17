import { Check, X } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  index: number;
  editedData: { date: string; holiday: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSave: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
};

export default function VacationEditRow({ index, editedData, onChange, onSave, onCancel, isSaving }: Props) {
  const { t } = useLanguage();
  
  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-4">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
          {index + 1}
        </span>
      </td>
      <td className="px-4 py-4">
        <label htmlFor={`date-${index}`} className="sr-only">{t.date}</label>
        <input
          id={`date-${index}`}
          type="date"
          value={editedData.date}
          onChange={(e) => onChange(e, "date")}
          className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </td>
      <td className="px-4 py-4">
        <label htmlFor={`holiday-${index}`} className="sr-only">{t.holidayName}</label>
        <input
          id={`holiday-${index}`}
          value={editedData.holiday}
          onChange={(e) => onChange(e, "holiday")}
          placeholder={t.holidayName}
          className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={onSave}
            disabled={isSaving}
            aria-label="Save changes"
            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Check size={16} aria-hidden="true" />
            )}
          </button>
          {onCancel && (
            <button 
              onClick={onCancel}
              disabled={isSaving}
              aria-label="Cancel editing"
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
