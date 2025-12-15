import { ProjectData } from "@/types/project";
import SidebarItem from "./SidebarItem";
import { useProjects } from "@/app/context/ProjectContext";

interface SidebarListProps {
  sidebarProjects: ProjectData[];
}

export default function SidebarList({ sidebarProjects }: SidebarListProps) {
  const { loadingProjects } = useProjects();

  if (sidebarProjects.length === 0) {
    return <p className="text-center text-gray-500 p-4">No projects</p>;
  }

  if (loadingProjects) {
    return null
  }

  return (
    <div className="overflow-auto">
      <div className="h-9 2xl:h-10 flex justify-center font-semibold text-[#244B77] items-center border-b">Projects</div>
      {sidebarProjects.sort((a, b) => a.company.localeCompare(b.company)).map(({ company, projects }) => (
        <SidebarItem key={company} company={company} projects={projects} />
      ))}
    </div>
  );
}