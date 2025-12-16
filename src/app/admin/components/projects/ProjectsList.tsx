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
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <FolderOpen className="text-white" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Projects</h2>
              <p className="text-xs text-slate-500">Manage company projects</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
              <Building2 size={12} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-700">{companies.length}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg">
              <FolderOpen size={12} className="text-indigo-500" />
              <span className="text-xs font-medium text-indigo-700">{totalProjects}</span>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
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
