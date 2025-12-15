import React from "react";
import { ProjectEntry } from "@/types/project";
import ProjectManage from "./ProjectManage";
import { Building2, FolderOpen } from "lucide-react";

interface ProjectListProps {
  selectors: { [key: string]: ProjectEntry[] };
  onOptionsModified: (id:number, newValue:string, operation: 'update'|'delete') => Promise<void>;
}

export default function ProjectList({
  selectors,
  onOptionsModified
}: ProjectListProps) {
  const companies = Object.keys(selectors).sort((a, b) => a.localeCompare(b));
  const totalProjects = Object.values(selectors).flat().length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <FolderOpen className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Projects</h2>
            <p className="text-sm text-slate-500">Manage company projects</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
            <Building2 size={14} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{companies.length} Companies</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg">
            <FolderOpen size={14} className="text-indigo-500" />
            <span className="text-sm font-medium text-indigo-700">{totalProjects} Projects</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FolderOpen size={48} strokeWidth={1} />
            <p className="mt-3 text-sm">No projects yet</p>
          </div>
        ) : (
          companies.map((company) => (
            <ProjectManage
              key={company}
              label={company}
              id={company}
              editable={true}
              options={selectors[company]}
              placeholder="View Projects"
              onOptionsModified={onOptionsModified}
            />
          ))
        )}
      </div>
    </div>
  );
}
