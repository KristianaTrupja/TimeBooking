"use client";

import { useEffect, useMemo, useState } from "react";
import BottomBar from "../components/calendar/BottomBar";
import Calendar from "../components/calendar/Calendar";
import TotalBar from "../components/calendar/TotalBar";
import { useWorkHours } from "@/app/context/WorkHoursContext";
import { usePathname } from "next/navigation";
import { useCalendar } from "@/app/context/CalendarContext";
import { PendingWorkPrompt } from "../components/pendingHoursPrompt/PendingWorkPrompt";
import Spinner from "@/components/ui/Spinner";
import { useProjects } from "@/app/context/ProjectContext";
import SaveButton from "../components/calendarActionButtons/SaveButton";
import SidebarHeader from "../components/sidebar/SidebarHeader";
import Sidebar from "../components/sidebar/Sidebar";
import { Button } from '@/components/ui/button'
import { flushError } from "@/app/utils/flushError";
import { User } from "next-auth";
import { getSession } from "next-auth/react";


export default function Developer() {
    const { reloadWorkHours, metadata, submitTimesheet } = useWorkHours();
    const pathname = usePathname();
    const { month, year } = useCalendar();
    const { loadingProjects } = useProjects();
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

    const userId = useMemo(() => {
        const segments = pathname?.split("/") || [];
        return segments[2] || "";
    }, [pathname]);

    useEffect(() => {
        async function fetchSession() {
            const session = await getSession()
            if (session?.user?.id) {
            setLoggedInUser(session.user)
            }
        }
        fetchSession()
    }, [])

    async function handleSubmit(){
        if(isSubmitting) return
        setIsSubmitting(true)
        try {
            await submitTimesheet(month, year, userId)
        } catch (error) {
            console.error(error)
            flushError(error, "Error submitting timesheet.")
        }
        finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        if (!userId) return;
        reloadWorkHours(userId, month + 1, year);
    }, [userId, month, year]);

    const isOwner = useMemo(() => {
        return loggedInUser?.id === userId;
    }, [loggedInUser, userId]);

    return (
                          
    <main>
        <SidebarHeader />
        <section className="2xl:w-full flex">
            <Sidebar isOwner={isOwner} />
            <section className="relative w-full flex flex-col justify-between" style={{ fontFamily: "var(--font-anek-bangla)" }} >
                <div className="flex min-h-[500px]">
                    {loadingProjects ? (
                    <div className="fixed left-0 top-0 w-full h-full">
                        <Spinner />
                    </div>
                    ) : (
                    <>
                    <PendingWorkPrompt />
                    <Calendar isOwner={isOwner} />
                    <TotalBar isOwner={isOwner} />
                    </>
                    )}
                </div>
                <BottomBar />
                {/* <Toaster position="top-center" /> */}
            </section>
        </section>
        <div className="flex justify-end items-center gap-4 p-4 mt-5">
            {/* <ConfirmButton /> */}
            {isOwner && !metadata?.isLocked && (
                <>
                <Button disabled={isSubmitting} onClick={handleSubmit}>Submit timesheet</Button>
                <SaveButton />
                </>
                )}
        </div>
    </main>         

    );
}
