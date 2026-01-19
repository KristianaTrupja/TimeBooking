"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { useSaveWorkHours } from "@/app/hooks/useSaveWorkHours";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

export default function SaveButton() {
  const { year, month, setIsSaved } = useCalendar();
  const { setWorkHoursForProject, reloadWorkHours } = useWorkHours();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  const handleClick = async () => {
    setIsSaving(true);
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

      toast.success(`Successfully saved ${workHoursToSave.length} work hour ${workHoursToSave.length === 1 ? 'entry' : 'entries'}!`);
      setIsSaved(true);
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to save working hours");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button 
      onClick={handleClick}
      loading={isSaving}
      className="bg-white border border-blue-600 text-blue-600 font-semibold shadow-sm hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
    >
      <Save size={16} className="mr-2" />
      {t.saveHours}
    </Button>
  );
}
