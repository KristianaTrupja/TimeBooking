import { Trash2, Pencil, Calendar } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  emp: { id: number; date: string; title: string };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
};

export default function VacationRow({ emp, index, onEdit, onDelete, isDeleting }: Props) {
  const { language } = useLanguage();
  
  function formatToDayMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'de' ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "long",
    });
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-4">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          {index + 1}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-slate-800 font-semibold">{formatToDayMonth(emp.date)}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-slate-800 font-medium">{emp.title}</span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={onEdit}
            aria-label={`Edit holiday: ${emp.title}`}
            className="p-2 rounded-lg hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button 
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={`Delete holiday: ${emp.title}`}
            className="p-2 rounded-lg hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Trash2 size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
