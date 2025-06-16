"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/app/components/ui/Modal";
import { useSaveWorkHours } from "@/app/hooks/useSaveWorkHours";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { toast } from "sonner";

export const PendingWorkPrompt = () => {
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const { year, month, refreshPendingStatus, showPendingDataModal, setShowPendingDataModal, isPending, setIsSaved } = useCalendar();
  const { setWorkHoursForProject, reloadWorkHours } = useWorkHours();

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

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith("workhours_")) {
        const parts = key.split("_");
        const [, userId, projectKey, date] = parts;
        const value = sessionStorage.getItem(key);
        if (!value) continue;

        const { hours, note } = JSON.parse(value);
        const save = useSaveWorkHours({
          date,
          userId,
          projectKey,
          reloadWorkHours,
          setWorkHoursForProject,
          month,
          year,
        });

        await save(hours, note);
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    toast.success("All work hours have been saved!");
    refreshPendingStatus();
    setShowPendingDataModal(false);
    setIsSaved(true)
  };
  return (
    <Modal isOpen={showPendingDataModal} onClose={() => setShowPendingDataModal(false)} title="Pending Hours">
      <p className="mb-4">You have unsaved work hours. Do you want to keep them for now or discard them?</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={discardPending}>
          Discard
        </Button>
        <Button onClick={handleClick}>Keep</Button>
      </div>
    </Modal>
  );
};
