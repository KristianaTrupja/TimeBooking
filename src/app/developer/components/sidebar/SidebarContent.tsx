import { Button } from "@/components/ui/button";
import SidebarList from "./SidebarList";
import { ProjectData } from "@/types/project";
import { Plus } from "lucide-react";

export default function SidebarContent({ isLocked, isOwner=false, sidebarProjects, openModal }: {isLocked?:boolean, isOwner:boolean, sidebarProjects: ProjectData[], openModal: () => void }) {
  return (
    <aside className="flex-1 min-w-fit bg-gradient-to-b from-slate-50 to-slate-100 rounded-l-xl border-r border-slate-200 flex flex-col justify-between shadow-sm">
      <div className="min-h-2">
        <SidebarList sidebarProjects={sidebarProjects} />
      </div>
      {isOwner && !isLocked && (
        <div className="p-3 border-t border-slate-200">
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
