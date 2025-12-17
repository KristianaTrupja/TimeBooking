import { Button } from "@/components/ui/button";
import SidebarList from "./SidebarList";
import { ProjectData } from "@/types/project";
import { Plus } from "lucide-react";

export default function SidebarContent({ isLocked, isOwner=false, sidebarProjects, openModal }: {isLocked?:boolean, isOwner:boolean, sidebarProjects: ProjectData[], openModal: () => void }) {
  return (
    <aside className="h-full min-w-[160px] w-fit max-w-[220px] bg-gradient-to-b from-slate-50 to-slate-100 rounded-l-xl border-r border-slate-200 flex flex-col justify-between shadow-md">
      <div className="flex-1 min-h-0">
        <SidebarList sidebarProjects={sidebarProjects} />
      </div>
      {isOwner && !isLocked && (
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md" 
            onClick={openModal}
          >
            <Plus size={18} className="mr-2" />
            Add Project
          </Button>
        </div>
      )}
    </aside>
  )
};
