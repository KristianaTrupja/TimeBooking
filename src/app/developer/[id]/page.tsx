"use client";

import { useEffect, useMemo } from "react";
import { signOut } from "next-auth/react";
import BottomBar from "../components/calendar/BottomBar";
import Calendar from "../components/calendar/Calendar";
import TotalBar from "../components/calendar/TotalBar";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { usePathname } from "next/navigation";
import { useCalendar } from "@/app/context/CalendarContext";
import { PendingWorkPrompt } from "../components/pendingHoursPrompt/PendingWorkPrompt";
import { Toaster } from "sonner";

export default function Developer() {
  const { reloadWorkHours } = useWorkHours();
  const pathname = usePathname();
  const { month, year } = useCalendar();

  const userId = useMemo(() => {
    const segments = pathname?.split("/") || [];
    return segments[2] || "";
  }, [pathname]);

  useEffect(() => {
    if (!userId) return;
    reloadWorkHours(userId, month + 1, year);
  }, [userId, month, year, reloadWorkHours]);


  return (
      <section
        style={{ fontFamily: "var(--font-anek-bangla)" }}
        className="relative flex flex-col justify-between"
      >
        <div className="flex min-h-[500px]">
          <PendingWorkPrompt/>
          <Calendar />
          <TotalBar />
        </div>
        <BottomBar />
        <Toaster position="top-center"/>
      </section>
  );
}
