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
    <table className="w-full text-[#244B77] border-separate" style={{ borderSpacing: "10px" }}>
      <thead className="bg-[#6C99CB] text-white">
        <tr className="text-left">
          <th className="px-4 py-2 w-16 rounded-sm">Nr</th>
          <th className="px-4 py-2">Employee</th>
          <th className="px-4 py-2">Email</th>
          <th className="px-4 py-2">Role</th>
          <th className="px-4 py-2">Password</th>
          <th className="px-4 py-2">Vacations</th>
          <th className="px-4 py-2">Edit</th>
          <th className="px-4 py-2">Delete</th>
        </tr>
      </thead>
      <tbody>
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
