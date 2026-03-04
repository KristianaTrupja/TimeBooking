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
  isCopying = false,
  isCollapsed = false
}: {
  isLocked?:boolean, 
  isOwner:boolean, 
  sidebarProjects: ProjectData[], 
  openModal: () => void,
  onCopyPreviousMonth: () => void,
  isCopying?: boolean,
  isCollapsed?: boolean
}) {
  const hasProjects = sidebarProjects.length > 0;
  
  return (
    <aside className={`h-full w-full bg-gradient-to-b from-slate-50 to-slate-100 rounded-l-xl border-r border-slate-200 flex flex-col shadow-md transition-all duration-300 overflow-hidden ${
      isCollapsed ? "min-w-[92px]" : "min-w-[160px]"
    }`}>
      <div className="flex-1 min-h-0 overflow-hidden">
        <SidebarList sidebarProjects={sidebarProjects} isCollapsed={isCollapsed} />
      </div>
      {isOwner && !isLocked && !isCollapsed && (
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
