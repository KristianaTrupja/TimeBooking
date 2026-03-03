import React from "react";
import { Button } from "@/components/ui/button";
import { FormData, Company } from "@/types/project";
import { Building2, FolderPlus, Plus } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

interface ProjectsFormProps {
  formData: FormData;
  companies: Company[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
}

export default function ProjectsForm({
  formData,
  companies,
  handleChange,
  handleSubmit,
  isSubmitting = false,
}: ProjectsFormProps) {
  const { t } = useLanguage();
  const activeCompanies = companies.filter((c) => c.isActive);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <FolderPlus className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t.newProject}</h3>
          <p className="text-sm text-slate-600">{t.addToCompany}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="companyId" className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
            <Building2 size={14} className="text-slate-600" />
            {t.companyName}
          </label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId || ""}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="">{t.selectCompany}</option>
            {activeCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          {activeCompanies.length === 0 && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              ! {t.noCompaniesAvailable} {t.goToCompaniesTabToCreate}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="project" className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
            <FolderPlus size={14} className="text-slate-600" />
            {t.projectName}
          </label>
          <input
            id="project"
            name="project"
            value={formData.project}
            onChange={handleChange}
            type="text"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder={t.projectExampleName}
          />
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 py-2.5"
        >
          <Plus size={18} className="mr-2" />
          {isSubmitting ? t.adding : t.addProject}
        </Button>
      </form>
    </div>
  );
}

