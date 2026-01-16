import React from "react";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { Company } from "@/types/project";

interface CompanyFormProps {
  companyName: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

export default function CompanyForm({
  companyName,
  handleChange,
  handleSubmit,
  isSubmitting = false,
}: CompanyFormProps) {
  const { t } = useLanguage();
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Building2 className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">New Company</h3>
          <p className="text-sm text-slate-600">Add a new company</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="companyName" className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
            <Building2 size={14} className="text-slate-600" />
            {t.companyName}
          </label>
          <input
            id="companyName"
            name="companyName"
            value={companyName}
            onChange={handleChange}
            type="text"
            autoComplete="off"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., Omegaventus"
            required
          />
        </div>

        <Button 
          type="submit"
          loading={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 py-2.5"
        >
          <Plus size={18} className="mr-2" />
          {isSubmitting ? "Adding..." : "Add Company"}
        </Button>
      </form>
    </div>
  );
}
