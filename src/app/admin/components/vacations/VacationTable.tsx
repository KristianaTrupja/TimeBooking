import { useState, useCallback, useMemo } from "react";
import VacationRow from "./VacationRow";
import VacationEditRow from "./VacationEditRow";
import { Holiday } from "@/types/holiday";
import { CalendarDays, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = "date" | "title";
type SortDirection = "asc" | "desc" | null;

type Props = {
  vacations: Holiday[];
  editingId: number | null;
  editedData: { date: string; holiday: string };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, field: "date" | "holiday") => void;
  onSave: (id: number) => void;
  savingId?: number | null;
  deletingId?: number | null;
};

export default function VacationTable({
  vacations,
  editingId,
  editedData,
  onEdit,
  onDelete,
  onChange,
  onSave,
  savingId,
  deletingId,
}: Props) {
  const [sortField, setSortField] = useState<SortField | null>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField, sortDirection]);

  const getSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-slate-400" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp size={14} className="text-[#244B77]" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown size={14} className="text-[#244B77]" />;
    }
    return <ArrowUpDown size={14} className="text-slate-400" />;
  }, [sortField, sortDirection]);

  // Sort vacations
  const sortedVacations = useMemo(() => {
    const sorted = [...vacations];
    
    if (!sortField || !sortDirection) {
      return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [vacations, sortField, sortDirection]);

  return (
    <>
      {vacations?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <CalendarDays size={48} className="text-slate-400 mb-3" aria-hidden="true" />
          <p className="text-lg font-semibold text-slate-700">No holidays found</p>
          <p className="text-sm text-slate-500 font-medium">Add a new holiday to get started</p>
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
              <th className="px-4 py-3 font-bold w-16 bg-slate-100">#</th>
              <th className="px-4 py-3 font-bold bg-slate-100">
                <button 
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  Date {getSortIcon("date")}
                </button>
              </th>
              <th className="px-4 py-3 font-bold bg-slate-100">
                <button 
                  onClick={() => handleSort("title")}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  Holiday Name {getSortIcon("title")}
                </button>
              </th>
              <th className="px-4 py-3 font-bold text-center bg-slate-100">Actions</th>
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
                  isSaving={savingId === emp.id}
                />
              ) : (
                <VacationRow
                  key={emp.id}
                  index={index}
                  emp={emp}
                  onEdit={() => onEdit(emp.id)}
                  onDelete={() => onDelete(emp.id)}
                  isDeleting={deletingId === emp.id}
                />
              )
            )}
          </tbody>
        </table>
      )}
    </>
  );
}
