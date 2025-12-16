import { Check, X } from "lucide-react";

type Props = {
  index: number;
  editedData: { date: string; holiday: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSave: () => void;
  onCancel?: () => void;
};

export default function VacationEditRow({ index, editedData, onChange, onSave, onCancel }: Props) {
  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-4">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
          {index + 1}
        </span>
      </td>
      <td className="px-4 py-4">
        <label htmlFor={`date-${index}`} className="sr-only">Holiday date</label>
        <input
          id={`date-${index}`}
          type="date"
          value={editedData.date}
          onChange={(e) => onChange(e, "date")}
          className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </td>
      <td className="px-4 py-4">
        <label htmlFor={`holiday-${index}`} className="sr-only">Holiday name</label>
        <input
          id={`holiday-${index}`}
          value={editedData.holiday}
          onChange={(e) => onChange(e, "holiday")}
          placeholder="Holiday name"
          className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={onSave}
            aria-label="Save changes"
            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <Check size={16} aria-hidden="true" />
          </button>
          {onCancel && (
            <button 
              onClick={onCancel}
              aria-label="Cancel editing"
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
