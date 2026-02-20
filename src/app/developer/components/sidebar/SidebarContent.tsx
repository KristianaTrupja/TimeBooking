"use client";

import { Button } from "@/components/ui/button";
import SidebarList from "./SidebarList";
import { ProjectData } from "@/types/project";

export default function SidebarContent({ 
  isLocked, 
  isOwner=false, 
  sidebarProjects, 
  openModal,
  onCopyPreviousMonth,
  isCopying = false
}: {
  isLocked?:boolean, 
  isOwner:boolean, 
  sidebarProjects: ProjectData[], 
  openModal: () => void,
  onCopyPreviousMonth: () => void,
  isCopying?: boolean
}) {
  const hasProjects = sidebarProjects.length > 0;
  
  return (
    <aside className="h-full w-full  min-w-[160px]  bg-gradient-to-b from-slate-50 to-slate-100 rounded-l-xl border-r border-slate-200 flex flex-col justify-between shadow-md">
      <div className="flex-1 min-h-0">
        <SidebarList sidebarProjects={sidebarProjects} />
      </div>
      {isOwner && !isLocked && (
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm text-xs px-2 disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={onCopyPreviousMonth}
              disabled={isCopying || hasProjects}
              title={hasProjects ? "Remove all projects to enable copying" : "Copy projects from previous month"}
            >
              copy job s-ord
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md text-xs px-2" 
              onClick={openModal}
            >
              new job s-ord
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
};
