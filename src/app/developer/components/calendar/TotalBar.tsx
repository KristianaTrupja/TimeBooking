"use client";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { useMemo } from "react";
import { Delete } from "lucide-react";
import { usePathname } from "next/navigation";
import { useProjects } from "@/app/context/ProjectContext";

export default function TotalBar() {
  const pathname = usePathname();
  const userId = pathname.split("/")[2];
  const { month, year } = useCalendar();
  const { getTotalHoursForProjectInMonth } = useWorkHours();
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
    <div className="flex flex-col justify-between border-gray-300 bg-blue-50 min-w-[70px]">
      <div className="flex flex-col overflow-auto items-center">
        <div className="border-gray-300 w-full border h-9 flex justify-center items-center text-black font-semibold">
          Totali
        </div>
        {sidebarProjects.map((group) => (
          <div key={group.company} className="w-full project-field">
            <div className="project-field__name flex items-center w-full h-[36px] font-semibold bg-gray-200 border-b border-gray-300 border-r" />
            {group.projects.map((proj) => {
              const total = getTotalHoursForProjectInMonth(userId, proj.projectKey, month + 1, year);
              return (
                <div
                  className="total-field flex h-9 gap-1 items-center justify-center border-b border-gray-300 relative px-8 border-r"
                  key={proj.projectKey}
                >
                  <div>{total.toFixed(2)}</div>
                  <Delete
                    className="w-5 h-5 text-red-500 cursor-pointer"
                    onClick={() => removeProject(proj.projectKey)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border border-gray-300 w-full h-9 flex justify-center items-center text-black font-semibold">
        {sum.toFixed(2)}
      </div>
    </div>
  );
}
