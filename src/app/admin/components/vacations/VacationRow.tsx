import { Trash2, Pencil, Calendar } from "lucide-react";

type Props = {
  emp: { id: number; date: string; title: string };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
};

export default function VacationRow({ emp, index, onEdit, onDelete }: Props) {
  function formatToDayMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
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
            aria-label={`Delete holiday: ${emp.title}`}
            className="p-2 rounded-lg hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
