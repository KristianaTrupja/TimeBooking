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
    setIsSaved(true);
  };

  return <Button onClick={handleClick}>Ruaj</Button>;
}
