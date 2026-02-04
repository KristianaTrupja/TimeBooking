"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/app/components/ui/Modal";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { toast } from "sonner";
import { useLanguage } from "@/app/context/LanguageContext";
import { Clock } from "lucide-react";

export const PendingWorkPrompt = () => {
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { year, month, refreshPendingStatus, showPendingDataModal, setShowPendingDataModal, isPending, setIsSaved } = useCalendar();
  const { reloadWorkHours } = useWorkHours();
  const { t } = useLanguage();

  const hasPrompted = useRef(false);

  useEffect(() => {
    if (hasPrompted.current) return;
    function getAllPendingWorkKeys(): string[] {
      return Object.keys(sessionStorage).filter((key) =>
        key.startsWith("workhours_")
      );
    }

    function getPendingWorkData(): { key: string; data: any }[] {
      return getAllPendingWorkKeys().map((key) => ({
        key,
        data: JSON.parse(sessionStorage.getItem(key) || "{}"),
      }));
    }

    const keys = getPendingWorkData().map((w) => w.key);
    if (keys.length > 0) {
      setPendingKeys(keys);
      setShowPendingDataModal(true);
      hasPrompted.current = true;
    }
  }, [showPendingDataModal]);

  const discardPending = () => {
    hasPrompted.current = true;
    refreshPendingStatus()
    pendingKeys.forEach((key) => {
      sessionStorage.removeItem(key)
    });
    setShowPendingDataModal(false);
  };

  const handleClick = async () => {
    const keysToRemove: string[] = [];
    const workHoursToSave: Array<{
      date: string;
      hours: number;
      note: string;
      userId: number;
      projectId: number;
    }> = [];

    setIsSaving(true);
    try {
      // Collect all work hours from sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("workhours_")) {
          const parts = key.split("_");
          const [, userId, projectKey, date] = parts;
          const value = sessionStorage.getItem(key);
          if (!value) continue;

          const { hours, note } = JSON.parse(value);
          const projectId = parseInt(projectKey.split("-")[1], 10);
          const isoDate = new Date(`${date}T00:00:00Z`).toISOString();

          workHoursToSave.push({
            date: isoDate,
            hours,
            note,
            userId: parseInt(userId, 10),
            projectId,
          });

          keysToRemove.push(key);
        }
      }

      if (workHoursToSave.length === 0) {
        toast.info("No work hours to save");
        setShowPendingDataModal(false);
        return;
      }

      // Send all work hours in a single batch request
      const response = await fetch("/api/workhours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workHours: workHoursToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save working hours");
      }

      // Clear sessionStorage and reload work hours
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
      
      // Reload work hours for the current user
      if (workHoursToSave.length > 0) {
        const firstEntry = workHoursToSave[0];
        await reloadWorkHours(String(firstEntry.userId), month + 1, year);
      }

      toast.success(t.allWorkHoursSaved);
      refreshPendingStatus();
      setShowPendingDataModal(false);
      setIsSaved(true);
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to save working hours");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Modal
      isOpen={showPendingDataModal}
      onClose={() => (isSaving ? null : setShowPendingDataModal(false))}
      title={
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Clock className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-semibold text-slate-800">{t.pendingHours}</h2>
            <p className="text-sm text-slate-400 font-normal">
              {pendingKeys.length} {pendingKeys.length === 1 ? "entry" : "entries"} pending
            </p>
          </div>
        </div>
      }
      className="max-w-md"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={discardPending}
            disabled={isSaving}
            className="rounded-xl"
          >
            {t.discard}
          </Button>
          <Button
            onClick={handleClick}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#244B77] to-[#1a3a5c] hover:from-[#2d5a8a] hover:to-[#244B77] text-white rounded-xl shadow-md shadow-[#244B77]/20 transition-all"
          >
            {isSaving ? t.saving : t.keep}
          </Button>
        </div>
      }
    >
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          {t.unsavedWorkHoursMessage}
        </p>
      </div>
    </Modal>
  );
};
