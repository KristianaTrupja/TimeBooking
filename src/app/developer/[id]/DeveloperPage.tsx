"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Send } from "lucide-react"
import { flushError } from "@/app/utils/flushError";
import { User } from "next-auth";
import { getSession } from "next-auth/react";
import NavigationSidebar from "../components/navigation/NavigationSidebar";
import DeveloperVacations from "../components/vacations/DeveloperVacations";

type Tab = "time-reporting" | "vacations";

export default function Developer() {
    const { reloadWorkHours, metadata, submitTimesheet } = useWorkHours();
    const pathname = usePathname();
    const { month, year } = useCalendar();
    const { loadingProjects } = useProjects();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("time-reporting");

    const userId = useMemo(() => {
        const segments = pathname?.split("/") || [];
        return segments[2] || "";
    }, [pathname]);

    useEffect(() => {
        getSession().then(session => {
            if (session?.user?.id) {
                setLoggedInUser(session.user);
            }
        });
    }, []);

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await submitTimesheet(month, year, userId);
        } catch (error) {
            console.error(error);
            flushError(error, "Error submitting timesheet.");
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, month, year, userId, submitTimesheet]);

    useEffect(() => {
        if (!userId) return;
        reloadWorkHours(userId, month + 1, year);
    }, [userId, month, year, reloadWorkHours]);

    const isOwner = useMemo(() => {
        return loggedInUser?.id === userId;
    }, [loggedInUser?.id, userId]);

    return (
    <div className="flex">
        <NavigationSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Scrollable content area */}
        <div className="ml-64 flex-1 overflow-auto p-6 custom-scrollbar" style={{ height: "calc(100vh - 72px)" }}>
            {activeTab === "time-reporting" ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
                    <SidebarHeader />
                    <section className="flex min-w-max">
                        <Sidebar isOwner={isOwner} />
                        <section className="flex-shrink-0 flex flex-col justify-between" style={{ fontFamily: "var(--font-anek-bangla)" }} >
                            <div className="relative flex min-h-[500px]">
                                {loadingProjects ? (
                                <div className="absolute inset-0 z-10">
                                    <Spinner text="Loading calendar..." />
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
                        </section>
                    </section>
                    <div className="flex justify-end items-center gap-4 p-4 mt-5">
                        {isOwner && !metadata?.isLocked && (
                            <>
                            <Button 
                                disabled={isSubmitting} 
                                onClick={handleSubmit}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border-0 transition-all duration-300"
                            >
                                <Send size={16} className="mr-2" />
                                Submit timesheet
                            </Button>
                            <SaveButton />
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <DeveloperVacations />
            )}
        </div>
    </div>         
    );
}
