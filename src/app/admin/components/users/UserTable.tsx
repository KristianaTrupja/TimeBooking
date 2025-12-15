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
      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
        <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
          <th className="px-4 py-3 font-semibold w-16">#</th>
          <th className="px-4 py-3 font-semibold">Employee</th>
          <th className="px-4 py-3 font-semibold">Email</th>
          <th className="px-4 py-3 font-semibold">Role</th>
          <th className="px-4 py-3 font-semibold">Password</th>
          <th className="px-4 py-3 font-semibold">Vacations</th>
          <th className="px-4 py-3 font-semibold text-center">Actions</th>
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
