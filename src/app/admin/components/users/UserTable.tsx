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
        <tr className="text-left text-xs uppercase tracking-wider text-slate-600 border-b border-slate-200">
          <th className="px-4 py-3 font-bold w-16 bg-slate-100">#</th>
          <th className="px-4 py-3 font-bold bg-slate-100">Employee</th>
          <th className="px-4 py-3 font-bold bg-slate-100">Email</th>
          <th className="px-4 py-3 font-bold bg-slate-100">Role</th>
          <th className="px-4 py-3 font-bold bg-slate-100">Password</th>
          <th className="px-4 py-3 font-bold bg-slate-100">Vacations</th>
          <th className="px-4 py-3 font-bold text-center bg-slate-100">Actions</th>
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
