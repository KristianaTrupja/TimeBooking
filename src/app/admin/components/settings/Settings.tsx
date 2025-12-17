"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Users, Pencil, User, Mail, Lock, Save, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(()=>{
    setFormData({
    username: session?.user?.username ?? "",
    email: session?.user?.email ?? "",
    password: "",
  })
  },[session])

  const handleNavigate = (tab: string) => {
    router.push(`?tab=${tab}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const payload: Record<string, string | number | undefined> = {
      id: session?.user?.id,
      username: formData.username,
      email: formData.email,
    };
    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!")
      } else {
        toast.error("Update failed!")
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-slate-700 text-white">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Profile Settings</h2>
          <p className="text-sm text-slate-500">Manage your account information</p>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Account Information</h3>
        
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="username"
                placeholder="Enter name"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                placeholder="Change password (leave empty to keep current)"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Quick Links Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Quick Links</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleNavigate("users")}
            className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 group-hover:bg-blue-100 transition-colors">
                <Users size={18} className="text-slate-600 group-hover:text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800 group-hover:text-blue-700">Users</p>
                <p className="text-xs text-slate-500">Manage employees</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500" />
          </button>

          <button
            onClick={() => handleNavigate("modify-absences")}
            className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-200 group-hover:bg-blue-100 transition-colors">
                <Pencil size={18} className="text-slate-600 group-hover:text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800 group-hover:text-blue-700">Absences</p>
                <p className="text-xs text-slate-500">Manage leave days</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
