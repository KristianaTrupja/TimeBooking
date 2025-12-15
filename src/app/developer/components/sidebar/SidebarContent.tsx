
import { Button } from "@/components/ui/button";
import SidebarList from "./SidebarList";
import { ProjectData } from "@/types/project";

export default function SidebarContent({ isLocked, isOwner=false, sidebarProjects, openModal }: {isLocked?:boolean, isOwner:boolean, sidebarProjects: ProjectData[], openModal: () => void }) {
  return (
    <aside className="flex-1 min-w-fit bg-[#E3F0FF] shadow-md border-[#244B77] flex flex-col justify-between align-center">
      <div className="min-h-2">
        <SidebarList sidebarProjects={sidebarProjects} />
      </div>
      {isOwner && !isLocked && <Button className="w-fit mx-auto my-2" onClick={openModal}>Add new project</Button>}
    </aside>
  )
};
