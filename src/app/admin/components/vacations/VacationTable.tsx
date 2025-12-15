import VacationRow from "./VacationRow";
import VacationEditRow from "./VacationEditRow";
import { Holiday } from "@/types/holiday";
import { CalendarDays } from "lucide-react";

type Props = {
  vacations: Holiday[];
  editingId: number | null;
  editedData: { date: string; holiday: string };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSave: (id: number) => void;
};

export default function VacationTable({
  vacations,
  editingId,
  editedData,
  onEdit,
  onDelete,
  onChange,
  onSave,
}: Props) {
  // Sort vacations by date
  const sortedVacations = [...vacations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {vacations?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <CalendarDays size={48} className="text-slate-300 mb-3" />
          <p className="text-lg font-medium text-slate-500">No holidays found</p>
          <p className="text-sm text-slate-400">Add a new holiday to get started</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-slate-700 sticky top-0">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-200">
              <th className="px-4 py-3 font-semibold w-16">#</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Holiday Name</th>
              <th className="px-4 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedVacations.map((emp, index) =>
              editingId === emp.id ? (
                <VacationEditRow
                  key={emp.id}
                  index={index}
                  editedData={editedData}
                  onChange={onChange}
                  onSave={() => onSave(emp.id)}
                />
              ) : (
                <VacationRow
                  key={emp.id}
                  index={index}
                  emp={emp}
                  onEdit={() => onEdit(emp.id)}
                  onDelete={() => onDelete(emp.id)}
                />
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
