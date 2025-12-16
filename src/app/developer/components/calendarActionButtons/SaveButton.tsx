"use client";

import { Button } from "@/components/ui/button";
import { useCalendar } from "@/app/context/CalendarContext";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { useSaveWorkHours } from "@/app/hooks/useSaveWorkHours";
import { toast } from "sonner";
import { Save } from "lucide-react";

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

  return (
    <Button 
      onClick={handleClick}
      className="bg-white border border-blue-600 text-blue-600 font-semibold shadow-sm hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
    >
      <Save size={16} className="mr-2" />
      Save Hours
    </Button>
  );
}
