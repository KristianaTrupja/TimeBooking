import { Delete, FilePenLine } from "lucide-react";

type Props = {
  emp: { id: number; date: string; title: string };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
};

export default function VacationRow({ emp, index, onEdit, onDelete }: Props) {
  function formatToDayMonth(dateStr: string): string {
    const date = new Date(dateStr); // e.g., "2025-06-05"
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
    });
  }
  return (
    <tr className="border-t border-[#d1d1d1] font-semibold text-lg bg-[#E3F0FF]" key={emp.id}>
      <td className="px-4 py-2 bg-[#244B77] text-white font-semibold rounded-sm text-xl">
        {index + 1}.
      </td>
      <td className="px-4 py-2 rounded-sm">{formatToDayMonth(emp.date)}</td>
      <td className="px-4 py-2 rounded-sm">{emp.title}</td>
      <td className="px-4 py-2 rounded-sm text-green-800">
        <button onClick={onEdit}>
          <FilePenLine />
        </button>
      </td>
      <td className="px-4 py-2 rounded-sm text-red-800">
        <button onClick={onDelete}>
          <Delete />
        </button>
      </td>
    </tr>
  );
}
