import React from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { isPasswordStrong } from "@/lib/utils";
import { UserPlus, User, Mail, Key, Shield } from "lucide-react";

type Props = {
  open: boolean;
  formData: { id: number, username: string; email: string; password: string; role: string };
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: () => void;
  isLoading?: boolean;
};

export function AddUserModal({ open, onClose, formData, onChange, onSubmit, isLoading }: Props) {
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
            <h3 className="text-lg font-semibold text-slate-800">New Employee</h3>
            <p className="text-sm text-slate-500 font-normal">Add a team member</p>
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
          {isLoading ? "Adding..." : "Add Employee"}
        </Button>
      }
    >
      <p className="mb-6 text-slate-500 text-sm">
        Fill in the required fields to create a new user and set a secure password.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <User size={14} className="text-slate-400" />
            Full Name
          </label>
          <input 
            name="username" 
            value={formData.username} 
            onChange={onChange} 
            placeholder="e.g., John Doe"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Mail size={14} className="text-slate-400" />
            Email
          </label>
          <input 
            name="email" 
            type="email"
            value={formData.email} 
            onChange={onChange} 
            placeholder="e.g., jdoe@example.com"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Key size={14} className="text-slate-400" />
            Password
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
            <p className="text-xs text-rose-500 mt-1">Min 8 chars, 1 uppercase, 1 number, 1 symbol</p>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Shield size={14} className="text-slate-400" />
            Role
          </label>
          <select 
            name="role"
            value={formData.role} 
            onChange={onChange}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="" disabled>Choose Role</option>
            <option value="Dev">Dev</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
