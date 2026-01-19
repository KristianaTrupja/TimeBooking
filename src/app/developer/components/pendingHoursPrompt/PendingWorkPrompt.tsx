"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/app/components/ui/Modal";
import { useSaveWorkHours } from "@/app/hooks/useSaveWorkHours";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { toast } from "sonner";
import { useLanguage } from "@/app/context/LanguageContext";

export const PendingWorkPrompt = () => {
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const { year, month, refreshPendingStatus, showPendingDataModal, setShowPendingDataModal, isPending, setIsSaved } = useCalendar();
  const { setWorkHoursForProject, reloadWorkHours } = useWorkHours();
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

          // Update local state optimistically
          await setWorkHoursForProject(date, userId, projectKey, hours, note);
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
    }
  };
  return (
    <Modal isOpen={showPendingDataModal} onClose={() => setShowPendingDataModal(false)} title={t.pendingHours}>
      <p className="mb-4">{t.unsavedWorkHoursMessage}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={discardPending}>
          {t.discard}
        </Button>
        <Button onClick={handleClick}>{t.keep}</Button>
      </div>
    </Modal>
  );
};
