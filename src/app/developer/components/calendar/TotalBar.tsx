"use client";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { useMemo } from "react";
import { Delete } from "lucide-react";
import { usePathname } from "next/navigation";
import { useProjects } from "@/app/context/ProjectContext";
import { User } from "next-auth";

export default function TotalBar({ isOwner=false }: { isOwner:boolean }) {
  const pathname = usePathname();
  const userId = pathname.split("/")[2];
  const { month, year } = useCalendar();
  const { getTotalHoursForProjectInMonth, metadata } = useWorkHours();
  const { sidebarProjects, removeProject, loadingProjects } = useProjects();

  const sum = useMemo(() => {
    if (!userId) return 0;
    return sidebarProjects.reduce((acc, group) => {
      return (
        acc +
        group.projects.reduce((subAcc, proj) => {
          return subAcc + getTotalHoursForProjectInMonth(userId, proj.projectKey, month + 1, year);
        }, 0)
      );
    }, 0);
  }, [sidebarProjects, getTotalHoursForProjectInMonth, month, year, userId]);

  if (!userId) {
    return <div className="p-4 text-red-600">User ID not found in URL.</div>;
  }

  if (loadingProjects) return null;

  return (
    <div className="h-full flex flex-col justify-between bg-gradient-to-b from-blue-50 to-blue-100 min-w-[90px] rounded-r-xl border-l border-slate-200 shadow-md">
      <div className="flex-1 flex flex-col items-center min-h-0">
        <div className="w-full h-10 2xl:h-11 flex justify-center items-center font-semibold text-sm bg-gradient-to-r from-[#1a3a5c] to-[#244B77] text-white rounded-tr-xl flex-shrink-0">
          Total
        </div>
        {sidebarProjects.map((group) => (
          <div key={group.company} className="w-full project-field">
            <div className="project-field__name flex items-center w-full h-9 2xl:h-10
             font-semibold bg-slate-100 border-b border-slate-200" />
            {group.projects.map((proj) => {
              const total = getTotalHoursForProjectInMonth(userId, proj.projectKey, month + 1, year);
              return (
                <div
                  className="total-field flex h-9 2xl:h-10 gap-2 items-center justify-center border-b border-slate-200 relative px-3 bg-white/50"
                  key={proj.projectKey}
                >
                  <div className="font-medium text-slate-700">{total.toFixed(2)}</div>
                  {isOwner && !metadata?.isLocked && <Delete
                    className="w-4 h-4 text-rose-400 hover:text-rose-600 cursor-pointer transition-colors"
                    onClick={() => removeProject(proj.projectKey)}
                  />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="w-full h-9 2xl:h-10 flex justify-center items-center font-bold text-blue-700 bg-blue-100 border-t border-blue-200 rounded-br-xl flex-shrink-0">
        {sum.toFixed(2)}
      </div>
    </div>
  );
}
