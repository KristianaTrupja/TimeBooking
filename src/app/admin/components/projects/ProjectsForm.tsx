import React from "react";
import { Button } from "@/components/ui/button";
import { FormData } from "@/types/project";
import { Building2, FolderPlus, Plus } from "lucide-react";

interface ProjectsFormProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  existingCompanies?: string[];
}

export default function ProjectsForm({
  formData,
  handleChange,
  handleSubmit,
  existingCompanies = [],
}: ProjectsFormProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 w-full lg:max-w-sm xl:max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <FolderPlus className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">New Project</h3>
          <p className="text-sm text-slate-600">Add a project to a company</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
            <Building2 size={14} className="text-slate-600" />
            Company Name
          </label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            type="text"
            list="company-suggestions"
            autoComplete="off"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., Omegaventus"
          />
          <datalist id="company-suggestions">
            {existingCompanies.map((company) => (
              <option key={company} value={company} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="project" className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
            <FolderPlus size={14} className="text-slate-600" />
            Project Name
          </label>
          <input
            id="project"
            name="project"
            value={formData.project}
            onChange={handleChange}
            type="text"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., Website Redesign"
          />
        </div>

        <Button 
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 py-2.5"
        >
          <Plus size={18} className="mr-2" />
          Add Project
        </Button>
      </form>
    </div>
  );
}
