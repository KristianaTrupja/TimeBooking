import { CircleArrowDown } from "lucide-react";

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
      <h3 className="bg-[#244B77] w-full h-9 text-white flex items-center justify-between border-[#244B77] px-2">
        {company} <CircleArrowDown />
      </h3>
      <ul>
        {projects.sort((a, b) => a.title.localeCompare(b.title)).map((project) => (
          <li
            key={project.projectKey}
            className="bg-[#6C99CB] h-[36px] px-4 flex items-center text-white pl-5 border-b border-[#244B77]"
          >
            {project.title}
          </li>
        ))}
      </ul>
    </div>
  );
}