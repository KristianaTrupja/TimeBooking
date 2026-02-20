import { Building2, FileCode } from "lucide-react";

interface SidebarItemProps {
  company: string;
  projects: {
    title: string;
    projectKey: string;
    isActive: boolean;
  }[];
}

export default function SidebarItem({ company, projects }: SidebarItemProps) {
  return (
    <div>
      <h3 className="bg-slate-100 w-full h-9 2xl:h-10 text-slate-700 flex items-center gap-2 border-b border-slate-200 px-3 font-semibold text-sm whitespace-nowrap">
        <Building2 size={16} className="text-slate-500 flex-shrink-0" />
        <span className="truncate" title={company}>{company}</span>
      </h3>
      <ul>
        {projects.map((project) => {
          const isInactive = !project.isActive;
          return (
          <li
            key={project.projectKey}
            className={`h-9 2xl:h-10 pl-5 pr-3 flex items-center gap-2 border-b border-slate-200 text-sm transition-colors whitespace-nowrap ${
              isInactive 
                ? 'bg-slate-300/50 text-slate-500 opacity-60 cursor-not-allowed' 
                : 'bg-white text-slate-600 hover:bg-blue-50'
            }`}
            title={isInactive ? `${project.title} (Inactive)` : project.title}
          >
            <FileCode size={14} className={`flex-shrink-0 ${isInactive ? 'text-slate-400' : 'text-blue-500'}`} />
            <span className="truncate">
              {project.title}
              {isInactive && <span className="ml-1 text-xs italic">(Inactive)</span>}
            </span>
          </li>
        )})}
      </ul>
    </div>
  );
}