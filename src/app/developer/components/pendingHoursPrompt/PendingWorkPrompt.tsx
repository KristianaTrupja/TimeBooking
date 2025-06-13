"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/app/components/ui/Modal";
import { useSaveWorkHours } from "@/app/hooks/useSaveWorkHours";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { toast } from "sonner";

export const PendingWorkPrompt = () => {
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const { year, month, } = useCalendar();
  const { setWorkHoursForProject, reloadWorkHours } = useWorkHours();
  const { showPendingModal, setShowPendingModal } = useCalendar();

  useEffect(() => {
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
      setShowPendingModal(true);
    }
  }, [showPendingModal]);

  const discardPending = () => {
    pendingKeys.forEach((key) => {
      sessionStorage.removeItem(key)
    });
    setShowPendingModal(false);
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
    setShowPendingModal(false);
  };
  return (
    <Modal isOpen={showPendingModal} onClose={() => setShowPendingModal(false)} title="Pending Hours">
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
