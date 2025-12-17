import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, User, Mail, Shield, Key, Calendar, Check } from "lucide-react";
import { User as UserType, UserFormData } from "@/types/user";
import { isPasswordStrong } from "@/lib/utils";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  emp: UserType;
  index: number;
  isEditing: boolean;
  formData: UserFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onEdit: (user: UserType) => void;
  onDelete: (user: UserType) => void;
  onSave: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
};

const ROLE_OPTIONS = ["Dev", "Admin"];

// Role badge styles
const roleBadgeStyles: Record<string, string> = {
  Admin: "bg-violet-100 text-violet-700 border-violet-200",
  Dev: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function UserRow({
  emp,
  index,
  isEditing,
  formData,
  onChange,
  onEdit,
  onDelete,
  onSave,
  isSaving,
  isDeleting,
}: Props) {
  const { t } = useLanguage();
  
  return (
    <tr className={`transition-all hover:bg-slate-50 ${isEditing ? "bg-blue-50" : ""}`}>
      {/* Number */}
      <td className="px-4 py-4">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          {index + 1}
        </span>
      </td>

      {isEditing ? (
        <>
          {/* Username */}
          <td className="px-4 py-3">
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={onChange}
              className="w-full px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </td>
          {/* Email */}
          <td className="px-4 py-3">
            <input
              name="email"
              type="text"
              value={formData.email}
              onChange={onChange}
              className="w-full px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </td>
          {/* Role */}
          <td className="px-4 py-3">
            <select
              name="role"
              value={formData.role}
              onChange={onChange}
              className="w-full px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((role, idx) => (
                <option key={idx} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </td>
          {/* Password */}
          <td className="px-4 py-3">
            <div className="relative">
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={onChange}
                placeholder={t.leaveBlankToKeep}
                autoComplete="off"
                className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.password && !isPasswordStrong(formData.password) ? "border-rose-400" : "border-blue-300"
                }`}
              />
              {formData.password && !isPasswordStrong(formData.password) && (
                <p className="text-xs text-rose-500 mt-1">{t.weakPassword}</p>
              )}
            </div>
          </td>
          {/* Vacations */}
          <td className="px-4 py-3">
            <input
              name="totalVacations"
              type="number"
              value={formData.totalVacations}
              onChange={onChange}
              className="w-20 px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </td>
          {/* Actions */}
          <td className="px-4 py-3 text-center">
            <Button 
              size="sm" 
              onClick={onSave}
              loading={isSaving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
            >
              <Check size={14} className="mr-1" />
              {isSaving ? t.saving : t.save}
            </Button>
          </td>
        </>
      ) : (
        <>
          {/* Username */}
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <User size={16} className="text-slate-600" />
              </div>
              <span className="font-semibold text-slate-900">{emp.username}</span>
            </div>
          </td>
          {/* Email */}
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-slate-500" />
              <span className="text-slate-700">{emp.email}</span>
            </div>
          </td>
          {/* Role */}
          <td className="px-4 py-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleBadgeStyles[emp.role] || "bg-slate-100 text-slate-700"}`}>
              {emp.role === "Admin" ? <Shield size={12} /> : null}
              {emp.role}
            </span>
          </td>
          {/* Password */}
          <td className="px-4 py-4">
            <div className="flex items-center gap-2 max-w-[120px]">
              <Key size={14} className="text-slate-500 flex-shrink-0" />
              <span className="text-slate-500 text-sm truncate" title={emp.password}>
                ••••••••
              </span>
            </div>
          </td>
          {/* Vacations */}
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-500" />
              <span className="font-bold text-slate-800">{emp.totalVacations}</span>
              <span className="text-slate-500 text-sm">{t.days}</span>
            </div>
          </td>
          {/* Actions */}
          <td className="px-4 py-4">
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => onEdit(emp)}
                className="p-2 rounded-lg hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label={`Edit employee: ${emp.username}`}
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => onDelete(emp)}
                disabled={isDeleting}
                className="p-2 rounded-lg hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Delete employee: ${emp.username}`}
              >
                {isDeleting ? (
                  <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Trash2 size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </td>
        </>
      )}
    </tr>
  );
}
