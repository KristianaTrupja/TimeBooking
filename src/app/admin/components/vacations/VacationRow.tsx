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
          <Calendar size={14} className="text-slate-400" />
          <span className="text-slate-700 font-medium">{formatToDayMonth(emp.date)}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-slate-700">{emp.title}</span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-blue-100 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
