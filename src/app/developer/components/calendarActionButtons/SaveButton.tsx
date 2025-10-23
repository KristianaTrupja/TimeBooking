"use client";

import { Button } from "@/components/ui/button";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { useSaveWorkHours } from "@/app/hooks/useSaveWorkHours";
import { toast } from "sonner";

export default function SaveButton() {
  const { year, month, setIsSaved } = useCalendar();
  const { setWorkHoursForProject, reloadWorkHours } = useWorkHours();

  const handleClick = async () => {
    const keysToRemove: string[] = [];
    let hasError

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
        try {
          await save(hours, note);
          keysToRemove.push(key);
        } catch (error) {
          hasError = true
          toast.error((error as Error)?.message || "Failed to save working hours")
        }
      }
    }
    if(hasError) return
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    toast.success("All work hours have been saved!");
    setIsSaved(true);
  };

  return <Button onClick={handleClick}>Save hours</Button>;
}
