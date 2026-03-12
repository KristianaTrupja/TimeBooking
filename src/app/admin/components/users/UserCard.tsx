import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, User as UserIcon, Mail, Shield, Key, Calendar, Check, MapPin } from "lucide-react";
import { LocationOption, User, UserFormData } from "@/types/user";
import { isPasswordStrong } from "@/lib/utils";
import { useLanguage } from "@/app/context/LanguageContext";

type Props = {
  emp: User;
  index: number;
  isEditing: boolean;
  formData: UserFormData;
  locations: LocationOption[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onSave: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
};

const ROLE_OPTIONS = ["Dev", "Employee", "Admin"];

const roleBadgeStyles: Record<string, string> = {
  Admin: "bg-violet-100 text-violet-700 border-violet-200",
  Dev: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Employee: "bg-blue-100 text-blue-700 border-blue-200",
};

export function UserCard({
  emp,
  index,
  isEditing,
  formData,
  locations,
  onChange,
  onEdit,
  onDelete,
  onSave,
  isSaving,
  isDeleting,
}: Props) {
  const { t } = useLanguage();
  
  return (
    <div className={`p-4 border border-slate-200 rounded-lg transition-all ${isEditing ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" : "bg-white"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <UserIcon size={18} className="text-slate-600" />
          </div>
          {isEditing ? (
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={onChange}
              className="px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span className="font-bold text-base text-slate-900">{emp.username}</span>
          )}
        </div>
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          {index + 1}
        </span>
      </div>

      {/* Email */}
      <div className="mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Mail size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.email}</span>
        </div>
        {isEditing ? (
          <div>
            <input
              name="email"
              type="text"
              value={formData.email}
              onChange={onChange}
              placeholder={formData.role === "Admin" ? t.emailRequired : t.emailOptional}
              className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formData.role === "Admin" && !formData.email ? "border-rose-400" : "border-blue-300"
              }`}
            />
            {formData.role === "Admin" && !formData.email && (
              <p className="text-xs text-rose-500 mt-1">{t.emailRequiredForAdmin}</p>
            )}
          </div>
        ) : (
          <span className={emp.email ? "text-slate-700 ml-0 sm:ml-6" : "text-slate-400 italic ml-0 sm:ml-6"}>
            {emp.email || t.noEmail}
          </span>
        )}
      </div>

      {/* Role */}
      <div className="mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.role}</span>
        </div>
        {isEditing ? (
          <select
            name="role"
            value={formData.role}
            onChange={onChange}
            className="w-full px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ml-0 sm:ml-6"
          >
            {ROLE_OPTIONS.map((role, idx) => (
              <option key={idx} value={role}>
                {role}
              </option>
            ))}
          </select>
        ) : (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ml-0 sm:ml-6 ${roleBadgeStyles[emp.role] || "bg-slate-100 text-slate-700"}`}>
            {emp.role === "Admin" ? <Shield size={12} /> : null}
            {emp.role}
          </span>
        )}
      </div>

      {/* Password */}
      <div className="mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Key size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.password}</span>
        </div>
        {isEditing ? (
          <div>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={onChange}
              placeholder={t.leaveBlankToKeep}
              autoComplete="off"
              className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ml-0 sm:ml-6 ${
                formData.password && !isPasswordStrong(formData.password) ? "border-rose-400" : "border-blue-300"
              }`}
            />
            {formData.password && !isPasswordStrong(formData.password) && (
              <p className="text-xs text-rose-500 mt-1 ml-0 sm:ml-6">{t.weakPassword}</p>
            )}
          </div>
        ) : (
          <span className="text-slate-500 text-sm ml-0 sm:ml-6">••••••••</span>
        )}
      </div>

      {/* Vacations */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">Location</span>
        </div>
        {isEditing ? (
          <select
            name="locationId"
            value={formData.locationId || ""}
            onChange={onChange}
            className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ml-0 sm:ml-6 ${
              !formData.locationId ? "border-rose-400" : "border-blue-300"
            }`}
          >
            <option value="" disabled>
              Select location
            </option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 ml-0 sm:ml-6">
            <span className="text-slate-700">{emp.locationName || "Unassigned"}</span>
          </div>
        )}
      </div>

      {/* Vacations */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-xs font-semibold uppercase text-slate-500">{t.vacations}</span>
        </div>
        {isEditing ? (
          <input
            name="totalVacations"
            type="number"
            value={formData.totalVacations}
            onChange={onChange}
            className="w-24 px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ml-0 sm:ml-6"
          />
        ) : (
          <div className="flex items-center gap-2 ml-0 sm:ml-6">
            <span className="font-bold text-slate-800">{emp.totalVacations}</span>
            <span className="text-slate-500 text-sm">{t.days}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isEditing ? (
          <Button 
            size="sm" 
            onClick={onSave}
            loading={isSaving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
          >
            <Check size={14} className="mr-1" />
            {isSaving ? t.saving : t.save}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(emp)}
              className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Pencil size={14} className="mr-1" />
              {t.edit}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(emp)}
              disabled={isDeleting}
              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 size={14} className="mr-1" />
              {t.delete}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
