"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Send, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
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
    const [contentMarginLeft, setContentMarginLeft] = useState<string>("0");
    const [contentHeight, setContentHeight] = useState<string>("100vh");
    const [contentPaddingTop, setContentPaddingTop] = useState<string>("104px");
    const [isProjectsSidebarCollapsed, setIsProjectsSidebarCollapsed] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();
    const isMobileLayout = useIsMobile(1024);

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

    // Set content margin, height, and padding based on sidebar state and screen size
    useEffect(() => {
        const updateLayout = () => {
            const isDesktop = window.innerWidth >= 1024;
            const isTablet = window.innerWidth >= 640;
            const headerHeight = isDesktop ? 72 : isTablet ? 64 : 56;
            
            // Update margin
            if (isDesktop) {
                if (isCollapsed) {
                    setContentMarginLeft("72px");
                } else {
                    // Match Tailwind 2xl breakpoint used by sidebar width (w-64 starts at 1536px)
                    setContentMarginLeft(window.innerWidth >= 1536 ? "256px" : "208px");
                }
            } else {
                setContentMarginLeft("0");
            }
            
            // Update height
            const calculatedHeight = `calc(100vh - ${headerHeight}px)`;
            setContentHeight(calculatedHeight);
            
            // Update padding top
            if (isDesktop) {
                setContentPaddingTop("6px");
            } else if (isTablet) {
                setContentPaddingTop("112px");
            } else {
                setContentPaddingTop("104px");
            }
        };
        
        updateLayout();
        window.addEventListener("resize", updateLayout);
        return () => window.removeEventListener("resize", updateLayout);
    }, [isCollapsed]);

    const isOwner = useMemo(() => {
        return loggedInUser?.id === userId;
    }, [loggedInUser?.id, userId]);

    useEffect(() => {
        if (!isMobileLayout) return;
        requestAnimationFrame(() => {
            contentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        });
    }, [activeTab, isMobileLayout]);

    return (
    <div className="flex w-full">
        <NavigationSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Scrollable content area */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden sm:px-6 sm:py-6 custom-scrollbar transition-all duration-300"
          style={{ 
            marginLeft: contentMarginLeft,
            height: contentHeight,
            paddingTop: contentPaddingTop
          }}
        >
            {activeTab === "time-reporting" ? (
                <div className="bg-white rounded-xl sm:rounded-2xl sm:border sm:border-slate-200 p-3 sm:p-6 shadow-sm flex flex-col overflow-hidden" style={{ height: '100%', maxHeight: '100%' }}>
                    <SidebarHeader />
                    <section className="flex flex-1 min-h-0 relative" style={{ fontFamily: "var(--font-anek-bangla)" }}>
                        {/* Projects Sidebar - Sticky Left */}
                        <div className={`sticky left-0 z-20 bg-white flex-shrink-0 h-full transition-all duration-300 ${
                            isMobile && isProjectsSidebarCollapsed ? "w-[80px]" : ""
                        }`}>
                            <div className="relative h-full">
                                <Sidebar isOwner={isOwner} isCollapsed={isMobile && isProjectsSidebarCollapsed} />
                                {/* Mobile Toggle Button */}
                                {isMobile && (
                                    <button
                                        onClick={() => setIsProjectsSidebarCollapsed(!isProjectsSidebarCollapsed)}
                                        className={`absolute -right-3 top-3 w-6 h-6 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center transition-all z-50 backdrop-blur-sm ${
                                            isProjectsSidebarCollapsed ? "" : ""
                                        }`}
                                        aria-label={isProjectsSidebarCollapsed ? "Expand projects sidebar" : "Collapse projects sidebar"}
                                    >
                                        {isProjectsSidebarCollapsed ? (
                                            <ChevronRight size={14} className="text-white" />
                                        ) : (
                                            <ChevronLeft size={14} className="text-white" />
                                        )}
                                    </button>
                                )}
                            </div>
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
                    <div className="mt-4 -mx-3 sm:-mx-6 -mb-3 sm:-mb-6 px-3 sm:px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0 rounded-b-xl sm:rounded-b-2xl">
                        <div className="overflow-x-auto w-full sm:w-auto">
                          <CalendarLegend />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            {isOwner && !metadata?.isLocked && (
                                <>
                                <Button 
                                    disabled={isSubmitting} 
                                    onClick={handleSubmitClick}
                                    className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border-0 transition-all duration-300 text-sm"
                                >
                                    <Send size={14} className="mr-2 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">{t.submitTimesheet}</span>
                                    <span className="sm:hidden">{t.submit || "Submit"}</span>
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
