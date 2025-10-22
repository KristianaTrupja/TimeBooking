"use client";

import { useEffect, useMemo, useState } from "react";
import BottomBar from "../components/calendar/BottomBar";
import Calendar from "../components/calendar/Calendar";
import TotalBar from "../components/calendar/TotalBar";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { usePathname } from "next/navigation";
import { useCalendar } from "@/app/context/CalendarContext";
import { PendingWorkPrompt } from "../components/pendingHoursPrompt/PendingWorkPrompt";
import { Toaster } from "sonner";
import Spinner from "@/components/ui/Spinner";
import { useProjects } from "@/app/context/ProjectContext";
import SaveButton from "../components/calendarActionButtons/SaveButton";
import SidebarHeader from "../components/sidebar/SidebarHeader";
import Sidebar from "../components/sidebar/Sidebar";
import { Button } from '@/components/ui/button'
import { flushError } from "@/app/utils/flushError";


export default function Developer() {
    const { reloadWorkHours, metadata, submitTimesheet } = useWorkHours();
    const pathname = usePathname();
    const { month, year } = useCalendar();
    const { loadingProjects } = useProjects();
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(){
        if(isSubmitting) return
        setIsSubmitting(true)
        try {
            await submitTimesheet(month, year)
        } catch (error) {
            console.error(error)
            flushError(error, "Error submitting timesheet.")
        }
        finally {
            setIsSubmitting(false)
        }
    }

    const userId = useMemo(() => {
        const segments = pathname?.split("/") || [];
        return segments[2] || "";
    }, [pathname]);

    useEffect(() => {
        if (!userId) return;
        reloadWorkHours(userId, month + 1, year);
    }, [userId, month, year]);


    return (
                          
    <main>
        <SidebarHeader />
        <section className="2xl:w-full flex">
            <Sidebar />
            <section className="relative w-full flex flex-col justify-between" style={{ fontFamily: "var(--font-anek-bangla)" }} >
                <div className="flex min-h-[500px]">
                    {loadingProjects ? (
                    <div className="fixed left-0 top-0 w-full h-full">
                        <Spinner />
                    </div>
                    ) : (
                    <>
                    <PendingWorkPrompt />
                    <Calendar />
                    <TotalBar />
                    </>
                    )}
                </div>
                <BottomBar />
                {/* <Toaster position="top-center" /> */}
            </section>
        </section>
        <div className="flex justify-end items-center gap-4 p-4 mt-5">
            {/* <ConfirmButton /> */}
            {!metadata?.isLocked && (
                <>
                <Button disabled={isSubmitting} onClick={handleSubmit}>Submit timesheet</Button>
                <SaveButton />
                </>
                )}
        </div>
    </main>         

    );
}
