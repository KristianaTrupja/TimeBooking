"use client";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { useMemo, useState } from "react";
import { Delete } from "lucide-react";
import { usePathname } from "next/navigation";
import { useProjects } from "@/app/context/ProjectContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TotalBar({ isOwner=false }: { isOwner:boolean }) {
  const pathname = usePathname();
  const userId = pathname.split("/")[2];
  const { month, year } = useCalendar();
  const { getTotalHoursForProjectInMonth, metadata, reloadWorkHours } = useWorkHours();
  const { sidebarProjects, removeProject, loadingProjects } = useProjects();
  const { t } = useLanguage();
  const [confirmProjectKey, setConfirmProjectKey] = useState<string | null>(null);
  const [confirmHours, setConfirmHours] = useState<number>(0);
  const [isForceDeleting, setIsForceDeleting] = useState(false);

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

  const handleDeleteClick = (projectKey: string, hours: number) => {
    if (hours > 0) {
      setConfirmProjectKey(projectKey);
      setConfirmHours(hours);
      return;
    }
    removeProject(projectKey);
  };

  const handleForceDelete = async () => {
    if (!confirmProjectKey) return;
    setIsForceDeleting(true);
    try {
      const res = await fetch("/api/sidebarProjects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectKey: confirmProjectKey,
          year,
          month, // 0-indexed, matches SidebarProject storage
          force: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete project");
      }

      toast.success(data?.message || "Deleted");
      // Remove from sidebar UI and persist
      removeProject(confirmProjectKey);
      // Reload work hours once so calendar/total updates
      await reloadWorkHours(userId, month + 1, year);
    } catch (e) {
      toast.error((e as Error)?.message || "Failed to delete project");
    } finally {
      setIsForceDeleting(false);
      setConfirmProjectKey(null);
      setConfirmHours(0);
    }
  };

  return (
    <>
    <div className="h-full flex flex-col justify-between bg-gradient-to-b from-blue-50 to-blue-100 min-w-[90px] rounded-r-xl border-l border-slate-200 shadow-md">
      <div className="flex-1 flex flex-col items-center min-h-0">
        <div className="w-full h-10 2xl:h-11 flex justify-center items-center font-semibold text-sm bg-gradient-to-r from-[#1a3a5c] to-[#244B77] text-white rounded-tr-xl flex-shrink-0">
          {t.total}
        </div>
        {sidebarProjects.map((group) => (
          <div key={group.company} className="w-full project-field">
            <div className="project-field__name flex items-center w-full h-9 2xl:h-10
             font-semibold bg-slate-100 border-b border-slate-200" />
            {group.projects.map((proj) => {
              const total = getTotalHoursForProjectInMonth(userId, proj.projectKey, month + 1, year);
              const isInactive = !proj.isActive;
              return (
                <div
                  className={`total-field flex h-9 2xl:h-10 gap-2 items-center justify-center border-b border-slate-200 relative px-3 ${
                    isInactive ? 'bg-slate-300/50 opacity-60' : 'bg-white/50'
                  }`}
                  key={proj.projectKey}
                >
                  <div className={`font-medium ${isInactive ? 'text-slate-500' : 'text-slate-700'}`}>
                    {total.toFixed(2)}
                  </div>
                  {isOwner && !metadata?.isLocked && !isInactive && <Delete
                    className="w-4 h-4 text-rose-400 hover:text-rose-600 cursor-pointer transition-colors"
                    onClick={() => handleDeleteClick(proj.projectKey, total)}
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
    <Modal
      isOpen={!!confirmProjectKey}
      onClose={() => (isForceDeleting ? null : setConfirmProjectKey(null))}
      title="Delete project?"
      className="max-w-md"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setConfirmProjectKey(null)}
            disabled={isForceDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleForceDelete}
            disabled={isForceDeleting}
            className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white"
          >
            {isForceDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-slate-700">
        This project has <span className="font-semibold">{confirmHours.toFixed(2)}</span> hours logged for this month.
        Deleting it will also permanently remove those work hours.
      </p>
    </Modal>
    </>
  );
}
