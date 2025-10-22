
import { Button } from "@/components/ui/button";
import SidebarList from "./SidebarList";
import { ProjectData } from "@/types/project";

export default function SidebarContent({ isLocked, sidebarProjects, openModal }: {isLocked?:boolean, sidebarProjects: ProjectData[], openModal: () => void }) {
  return (
    <aside className="w-64 bg-[#E3F0FF] shadow-md border-[#244B77] flex flex-col justify-between align-center">
      <div className="min-h-2">
        <SidebarList sidebarProjects={sidebarProjects} />
      </div>
      {!isLocked && <Button className="w-fit mx-auto my-2" onClick={openModal}>Add new project</Button>}
    </aside>
  )
};
