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
        <input
          type="date"
          value={editedData.date}
          onChange={(e) => onChange(e, "date")}
          className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </td>
      <td className="px-4 py-4">
        <input
          value={editedData.holiday}
          onChange={(e) => onChange(e, "holiday")}
          placeholder="Holiday name"
          className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={onSave}
            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
          >
            <Check size={16} />
          </button>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
