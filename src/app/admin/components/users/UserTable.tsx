import React from "react";
import { User, UserFormData } from "@/types/user";
import { UserRow } from "./UserRow";

type Props = {
  employees: User[];
  editingId: number | null;
  formData: UserFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onSave: () => void;
};

export function UserTable({
  employees,
  editingId,
  formData,
  onChange,
  onEdit,
  onDelete,
  onSave,
}: Props) {
  return (
    <table className="w-full">
      <thead className="sticky top-0 z-10">
        <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <th className="px-4 py-3 font-semibold w-16 bg-slate-50">#</th>
          <th className="px-4 py-3 font-semibold bg-slate-50">Employee</th>
          <th className="px-4 py-3 font-semibold bg-slate-50">Email</th>
          <th className="px-4 py-3 font-semibold bg-slate-50">Role</th>
          <th className="px-4 py-3 font-semibold bg-slate-50">Password</th>
          <th className="px-4 py-3 font-semibold bg-slate-50">Vacations</th>
          <th className="px-4 py-3 font-semibold text-center bg-slate-50">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {employees.map((emp, index) => (
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
          />
        ))}
      </tbody>
    </table>
  );
}
