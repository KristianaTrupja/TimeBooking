import React from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { isPasswordStrong } from "@/lib/utils";
import { UserPlus, User, Mail, Key, Shield, MapPin } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { LocationOption, UserFormData } from "@/types/user";

type Props = {
  open: boolean;
  formData: UserFormData;
  locations: LocationOption[];
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: () => void;
  isLoading?: boolean;
};

export function AddUserModal({ open, onClose, formData, locations, onChange, onSubmit, isLoading }: Props) {
  const { t } = useLanguage();
  
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <UserPlus className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t.newEmployee}</h3>
            <p className="text-sm text-slate-500 font-normal">{t.addTeamMember}</p>
          </div>
        </div>
      }
      footer={
        <Button 
          onClick={onSubmit}
          loading={isLoading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25"
        >
          <UserPlus size={16} className="mr-2" />
          {isLoading ? t.adding : t.addEmployee}
        </Button>
      }
    >
      <p className="mb-6 text-slate-500 text-sm">
        {t.fillRequiredFields}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <User size={14} className="text-slate-400" />
            {t.fullName}
          </label>
          <input 
            name="username" 
            value={formData.username} 
            onChange={onChange} 
            placeholder={t.fullNameExample}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Mail size={14} className="text-slate-400" />
            {t.email}
            {formData.role === "Admin" ? (
              <span className="text-rose-500 text-xs">*</span>
            ) : (
              <span className="text-slate-400 text-xs">({t.optional})</span>
            )}
          </label>
          <input 
            name="email" 
            type="email"
            value={formData.email} 
            onChange={onChange} 
            placeholder={t.emailExample}
            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              formData.role === "Admin" && !formData.email ? "border-rose-400" : "border-slate-200"
            }`}
          />
          {formData.role === "Admin" && !formData.email && (
            <p className="text-xs text-rose-500 mt-1">{t.emailRequiredForAdmin}</p>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Key size={14} className="text-slate-400" />
            {t.password}
          </label>
          <input 
            name="password" 
            value={formData.password} 
            onChange={onChange} 
            type="password" 
            placeholder="••••••••" 
            autoComplete="new-password"
            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              formData.password && !isPasswordStrong(formData.password) ? "border-rose-400" : "border-slate-200"
            }`}
          />
          {formData.password && !isPasswordStrong(formData.password) && (
            <p className="text-xs text-rose-500 mt-1">{t.passwordValidation}</p>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Shield size={14} className="text-slate-400" />
            {t.role}
          </label>
          <select 
            name="role"
            value={formData.role} 
            onChange={onChange}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" disabled>{t.chooseRole}</option>
            <option value="Dev">{t.developer}</option>
            <option value="Employee">{t.employee}</option>
            <option value="Admin">{t.admin}</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <MapPin size={14} className="text-slate-400" />
            {t.location}
            <span className="text-rose-500 text-xs">*</span>
          </label>
          <select
            name="locationId"
            value={formData.locationId || ""}
            onChange={onChange}
            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !formData.locationId ? "border-rose-400" : "border-slate-200"
            }`}
          >
            <option value="" disabled>
              {t.selectLocation}
            </option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          {!formData.locationId && (
            <p className="text-xs text-rose-500 mt-1">{t.locationRequired}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
