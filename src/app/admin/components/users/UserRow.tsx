import React from "react";
import { Button } from "@/components/ui/button";
import { Delete, FilePenLine } from "lucide-react";
import { User, UserFormData } from "@/types/user";
import { InputField } from "@/app/components/ui/InputField";
import { isPasswordStrong } from "@/lib/utils";

type Props = {
  emp: User;
  index: number;
  isEditing: boolean;
  formData: UserFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onSave: () => void;
};

const ROLE_OPTIONS = ["Dev", "Admin"];

export function UserRow({
  emp,
  index,
  isEditing,
  formData,
  onChange,
  onEdit,
  onDelete,
  onSave,
}: Props) {
  return (
    <tr className="border-t border-[#d1d1d1] font-semibold text-lg bg-[#E3F0FF]">
      <td className="px-4 py-2 bg-[#244B77] text-white font-semibold rounded-sm text-xl">
        {index + 1}.
      </td>

      {isEditing ? (
        <>
          {["username", "email", "role", "password"].map((field) => (
            <td key={field} className="px-4 py-2 rounded-sm bg-yellow-100">
              {field === "role" ? (
                <select
                  name="role"
                  value={formData.role}
                  onChange={onChange}
                  className="border px-2 py-1 rounded w-full text-black font-normal"
                >
                  {ROLE_OPTIONS.map((role, index) => (
                    <option key={index} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                <InputField
                  name={field}
                  type={field === "password" ? "password" : "text"}
                  value={(formData as any)[field]}
                  onChange={onChange}
                  placeholder={
                    field === "password" ? "Leave blank to keep unchanged" : ""
                  }
                  tooltipMessage={true}
                  autoComplete="off"
                  error={field === "password" && !isPasswordStrong((formData as any)[field]) && (formData as any)[field] ? "Password must contain at least 8 characters, one uppercase letter A-Z, one number, and one special symbol (! @ # $ % ^ & * ( ) . _ - + =)." : undefined}
                />
              )}
            </td>
          ))}
          <td className="px-4 py-2 rounded-sm">
            <Button size="sm" onClick={onSave}>
              Save
            </Button>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-2 rounded-sm">{emp.username}</td>
          <td className="px-4 py-2 rounded-sm">{emp.email}</td>
          <td className="px-4 py-2 rounded-sm">{emp.role}</td>
          <td
            className="px-4 py-2 rounded-sm max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
            title={emp.password}
          >
            {emp.password}
          </td>
          <td className="px-4 py-2 rounded-sm text-green-800">
            <button onClick={() => onEdit(emp)}>
              <FilePenLine />
            </button>
          </td>
          <td className="px-4 py-2 rounded-sm text-red-800">
            <button onClick={() => onDelete(emp)}>
              <Delete />
            </button>
          </td>
        </>
      )}
    </tr>
  );
}
