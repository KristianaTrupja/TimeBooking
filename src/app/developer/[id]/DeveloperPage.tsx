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
import { useSidebar } from "@/app/context/SidebarContext";
import SaveButton from "../components/calendarActionButtons/SaveButton";
import SidebarHeader from "../components/sidebar/SidebarHeader";
import Sidebar from "../components/sidebar/Sidebar";
import { Button } from '@/components/ui/button';
import { Send, Lock } from "lucide-react";
import { flushError } from "@/app/utils/flushError";
import { User } from "next-auth";
import { getSession } from "next-auth/react";
import NavigationSidebar from "../components/navigation/NavigationSidebar";
import DeveloperVacations from "../components/vacations/DeveloperVacations";
import DeveloperHolidays from "../components/holidays/DeveloperHolidays";
import CalendarLegend from "../components/calendar/CalendarLegend";
import { useLanguage } from "@/app/context/LanguageContext";
import { Modal } from "@/app/components/ui/Modal";

type Tab = "time-reporting" | "vacations" | "holidays";

export default function Developer() {
    const { reloadWorkHours, metadata, submitTimesheet } = useWorkHours();
    const pathname = usePathname();
    const { month, year } = useCalendar();
    const { loadingProjects } = useProjects();
    const { isCollapsed } = useSidebar();
    const { t } = useLanguage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("time-reporting");
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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

    const handleSubmitClick = useCallback(() => {
        setShowConfirmModal(true);
    }, []);

    const handleConfirmSubmit = useCallback(async () => {
        if (isSubmitting) return;
        setShowConfirmModal(false);
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
        <div className={`flex-1 overflow-auto p-6 custom-scrollbar transition-all duration-300 ${isCollapsed ? "ml-[72px]" : "ml-52 2xl:ml-64"}`} style={{ height: "calc(100vh - 72px)" }}>
            {activeTab === "time-reporting" ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full flex flex-col overflow-hidden">
                    <SidebarHeader />
                    <section className="flex flex-1 min-h-0" style={{ fontFamily: "var(--font-anek-bangla)" }}>
                        {/* Projects Sidebar - Sticky Left */}
                        <div className="sticky left-0 z-20 bg-white flex-shrink-0 h-full">
                            <Sidebar isOwner={isOwner} />
                        </div>
                        
                        {/* Scrollable Calendar Area */}
                        <div className="overflow-x-auto custom-scrollbar h-full">
                            <div className="flex flex-col min-w-max h-full justify-between">
                                <div className="relative flex">
                                    {loadingProjects ? (
                                        <div className="absolute inset-0 z-10">
                                            <Spinner text={t.loadingCalendar} />
                                        </div>
                                    ) : (
                                        <>
                                            <PendingWorkPrompt />
                                            <Calendar isOwner={isOwner} />
                                        </>
                                    )}
                                </div>
                                <BottomBar />
                            </div>
                        </div>
                        
                        {/* TotalBar - Sticky Right */}
                        <div className="sticky right-0 z-20 bg-white flex-shrink-0 h-full">
                            {!loadingProjects && <TotalBar isOwner={isOwner} />}
                        </div>
                        
                        {/* Empty space filler - pushes calendar left */}
                        <div className="flex-1 bg-slate-50/50" />
                    </section>
                    {/* Status Bar - Separated from calendar */}
                    <div className="mt-4 -mx-6 -mb-6 px-6 py-3 border-t border-slate-200 flex justify-between items-center flex-shrink-0 rounded-b-2xl">
                        <CalendarLegend />
                        <div className="flex items-center gap-3">
                            {isOwner && !metadata?.isLocked && (
                                <>
                                <Button 
                                    disabled={isSubmitting} 
                                    onClick={handleSubmitClick}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border-0 transition-all duration-300"
                                >
                                    <Send size={16} className="mr-2" />
                                    {t.submitTimesheet}
                                </Button>
                                <SaveButton />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : activeTab === "vacations" ? (
                <DeveloperVacations />
            ) : (
                <DeveloperHolidays />
            )}
        </div>
        
        {/* Confirmation Modal */}
        <Modal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title={t.confirmSubmitTimesheet}
            className="max-w-md"
            footer={
                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setShowConfirmModal(false)}
                        disabled={isSubmitting}
                    >
                        {t.cancel}
                    </Button>
                    <Button
                        onClick={handleConfirmSubmit}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                    >
                        {isSubmitting ? t.saving : t.submitTimesheet}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <Lock className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900 mb-1">
                            {t.submitTimesheetWarning}
                        </p>
                        <p className="text-sm text-amber-700">
                            {t.submitTimesheetWarningDetail}
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    </div>         
    );
}
