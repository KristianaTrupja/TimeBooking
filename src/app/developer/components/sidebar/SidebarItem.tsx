import { Building2, FileCode } from "lucide-react";

interface SidebarItemProps {
  company: string;
  projects: {
    title: string;
    projectKey: string;
    isActive: boolean;
  }[];
  isCollapsed?: boolean;
}

export default function SidebarItem({ company, projects, isCollapsed = false }: SidebarItemProps) {
  const compactLabel = (value: string, keep = 4) => (value.length > keep ? `${value.slice(0, keep)}...` : value);

  return (
    <div>
      <h3 className={`bg-slate-100 w-full h-9 2xl:h-10 text-slate-700 flex items-center border-b border-slate-200 font-semibold text-sm whitespace-nowrap ${
        isCollapsed ? "px-1.5" : "gap-2 px-3"
      }`}>
        {!isCollapsed && <Building2 size={16} className="text-slate-500 flex-shrink-0" />}
        <span className="truncate" title={company}>
          {isCollapsed ? compactLabel(company) : company}
        </span>
      </h3>
      <ul>
        {projects.map((project) => {
          const isInactive = !project.isActive;
          return (
          <li
            key={project.projectKey}
            className={`h-9 2xl:h-10 ${isCollapsed ? "pl-1.5 pr-1.5 gap-0" : "pl-5 pr-3 gap-2"} flex items-center border-b border-slate-200 text-sm transition-colors whitespace-nowrap ${
              isInactive 
                ? 'bg-slate-300/50 text-slate-500 opacity-60 cursor-not-allowed' 
                : 'bg-white text-slate-600 hover:bg-blue-50'
            }`}
            title={isInactive ? `${project.title} (Inactive)` : project.title}
          >
            {!isCollapsed && (
              <FileCode size={14} className={`flex-shrink-0 ${isInactive ? 'text-slate-400' : 'text-blue-500'}`} />
            )}
            <span className="truncate">
              {isCollapsed ? compactLabel(project.title) : project.title}
              {isInactive && !isCollapsed && <span className="ml-1 text-xs italic">(Inactive)</span>}
            </span>
          </li>
        )})}
      </ul>
    </div>
  );
}
