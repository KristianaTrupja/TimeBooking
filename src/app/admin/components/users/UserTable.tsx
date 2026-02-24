import React, { useState, useCallback, useMemo } from "react";
import { User, UserFormData } from "@/types/user";
import { UserRow } from "./UserRow";
import { UserCard } from "./UserCard";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type SortField = "username" | "email" | "role" | "totalVacations";
type SortDirection = "asc" | "desc" | null;

type Props = {
  employees: User[];
  editingId: number | null;
  formData: UserFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onSave: () => void;
  isSaving?: boolean;
  deletingId?: number | null;
};

export function UserTable({
  employees,
  editingId,
  formData,
  onChange,
  onEdit,
  onDelete,
  onSave,
  isSaving,
  deletingId,
}: Props) {
  const [sortField, setSortField] = useState<SortField | null>("username");
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

  const { t } = useLanguage();

  const sortedEmployees = useMemo(() => {
    const sorted = [...employees];
    
    if (!sortField || !sortDirection) {
      return sorted.sort((a, b) => a.username.localeCompare(b.username));
    }

    return sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "username":
          comparison = a.username.localeCompare(b.username);
          break;
        case "email":
          comparison = (a.email ?? "").localeCompare(b.email ?? "");
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "totalVacations":
          comparison = (a.totalVacations || 0) - (b.totalVacations || 0);
          break;
      }
      
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [employees, sortField, sortDirection]);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <th className="px-4 py-3 font-bold w-16 bg-slate-100">#</th>
              <th className="px-4 py-3 font-bold bg-slate-100">
                <button 
                  onClick={() => handleSort("username")}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  {t.employee} {getSortIcon("username")}
                </button>
              </th>
              <th className="px-4 py-3 font-bold bg-slate-100">
                <button 
                  onClick={() => handleSort("email")}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  {t.email} {getSortIcon("email")}
                </button>
              </th>
              <th className="px-4 py-3 font-bold bg-slate-100">
                <button 
                  onClick={() => handleSort("role")}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  {t.role} {getSortIcon("role")}
                </button>
              </th>
              <th className="px-4 py-3 font-bold bg-slate-100">{t.password}</th>
              <th className="px-4 py-3 font-bold bg-slate-100">
                <button 
                  onClick={() => handleSort("totalVacations")}
                  className="flex items-center gap-1.5 hover:text-slate-900 transition-colors"
                >
                  {t.vacations} {getSortIcon("totalVacations")}
                </button>
              </th>
              <th className="px-4 py-3 font-bold text-center bg-slate-100">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEmployees.map((emp, index) => (
              <UserRow
                key={emp.id}
                emp={emp}
                index={index}
                isEditing={editingId === emp.id}
                formData={formData}
                onChange={onChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onSave={onSave}
                isSaving={isSaving && editingId === emp.id}
                isDeleting={deletingId === emp.id}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedEmployees.map((emp, index) => (
          <UserCard
            key={emp.id}
            emp={emp}
            index={index}
            isEditing={editingId === emp.id}
            formData={formData}
            onChange={onChange}
            onEdit={onEdit}
            onDelete={onDelete}
            onSave={onSave}
            isSaving={isSaving && editingId === emp.id}
            isDeleting={deletingId === emp.id}
          />
        ))}
      </div>
    </>
  );
}
