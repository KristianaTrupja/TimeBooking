import { Building2, FileCode } from "lucide-react";

interface SidebarItemProps {
  company: string;
  projects: {
    title: string;
    projectKey: string;
  }[];
}

export default function SidebarItem({ company, projects }: SidebarItemProps) {
  return (
    <div>
      <h3 className="bg-slate-100 w-full h-9 2xl:h-10 text-slate-700 flex items-center gap-2 border-b border-slate-200 px-3 font-semibold text-sm">
        <Building2 size={16} className="text-slate-500" />
        {company}
      </h3>
      <ul>
        {projects.sort((a, b) => a.title.localeCompare(b.title)).map((project) => (
          <li
            key={project.projectKey}
            className="bg-white h-9 2xl:h-10 px-3 flex items-center gap-2 text-slate-600 border-b border-slate-200 text-sm hover:bg-blue-50 transition-colors"
          >
            <FileCode size={14} className="text-blue-500" />
            {project.title}
          </li>
        ))}
      </ul>
    </div>
  );
}