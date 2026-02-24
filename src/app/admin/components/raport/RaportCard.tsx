import Link from "next/link";
import { Button } from "@/components/ui/button";
import Dropdown from "@/components/ui/Dropdown";
import { useState, useEffect, useRef } from "react";
import { SubmissionStatus, Timesheet } from "@/types/timesheet";
import { Eye, Clock, User, FileSpreadsheet } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import type { EmployeeTimesheetData } from "@/app/utils/excelExport";
import { toast } from "sonner";

type PropTypes = {
    timesheet: Timesheet,
    month: number
    year: number
    index: number
    adminId: string | null
    onApply: (submissionId: number, status: keyof typeof SubmissionStatus) => Promise<void>
    shouldScrollTo?: boolean
    onScrollComplete?: () => void
}

const statusBadgeStyles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    LOCKED: "bg-slate-200 text-slate-700 border-slate-300"
}

export default function RaportCard({timesheet, month, year, index, adminId, onApply, shouldScrollTo = false, onScrollComplete}: PropTypes) {
    const [selectedStatus, setSelectedStatus] = useState(timesheet.status)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isHighlighted, setIsHighlighted] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (shouldScrollTo && cardRef.current) {
            setIsHighlighted(true);
            const timer = setTimeout(() => {
                cardRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
                setTimeout(() => {
                    setIsHighlighted(false);
                    onScrollComplete?.();
                }, 2000);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [shouldScrollTo, onScrollComplete]);

    async function handleApply(){
        try {
            setIsSubmitting(true)
            await onApply(Number(timesheet.submission?.id), selectedStatus)
        } catch (error) {
            console.log(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDownloadExcel() {
        try {
            setIsDownloading(true);
            const response = await fetch(
                `/api/timesheets/${timesheet.userId}/export?month=${month}&year=${year}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch timesheet data");
            }

            const data: EmployeeTimesheetData = await response.json();
            
            const { exportTimesheetToExcel } = await import("@/app/utils/excelExport");
            exportTimesheetToExcel(data);
            toast.success("Excel file downloaded successfully!");
        } catch (error) {
            console.error("Error downloading Excel:", error);
            toast.error("Failed to download Excel file");
        } finally {
            setIsDownloading(false);
        }
    }

  const isDisabled = !timesheet.submission || !timesheet.status || timesheet.status === "DRAFT" || isSubmitting;
  const statusStyle = statusBadgeStyles[timesheet.status || "DRAFT"];
  const isInactive = !timesheet.isActive;

  return (
    <div
        ref={cardRef}
        className={`p-4 border border-slate-200 rounded-lg transition-all duration-300 ${isInactive ? 'bg-slate-50 opacity-75' : 'bg-white'} ${isHighlighted ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
    >
        {/* Employee Info */}
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isInactive ? 'from-slate-300 to-slate-400' : 'from-slate-200 to-slate-300'} flex items-center justify-center`}>
                    <User size={18} className={isInactive ? "text-slate-500" : "text-slate-600"} />
                </div>
                <div className="flex flex-col">
                    <span className={`font-bold text-base ${isInactive ? 'text-slate-500' : 'text-slate-900'}`}>
                        {timesheet.username}
                    </span>
                    {isInactive && (
                        <span className="text-xs text-slate-500 italic">(Inactive)</span>
                    )}
                </div>
            </div>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {index + 1}
            </span>
        </div>

        {/* Hours */}
        <div className="mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">{t.hours}</span>
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    <span className="font-bold text-slate-800 tabular-nums">{timesheet.totalHours.toFixed(2)}</span>
                    <span className="text-slate-500 text-sm">{t.hrs}</span>
                </div>
            </div>
        </div>

        {/* Status */}
        <div className="mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">{t.status}</span>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle}`}>
                    <Dropdown
                        values={Object.values(SubmissionStatus)}
                        value={selectedStatus}
                        formatValues={v => v}
                        selectedValue={v => v || "DRAFT"}
                        onSelect={(value) => {setSelectedStatus(value || "DRAFT")}}
                        hasAllOption={false}
                        isDisabled={isDisabled}
                    />
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
            <Link href={`/developer/${timesheet.userId}?adminId=${adminId}&month=${month + 1}&year=${year}`} className="w-full">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 font-medium border-blue-200"
                >
                    <Eye size={16} />
                    {t.view} Details
                </Button>
            </Link>
            
            <div className="flex gap-2">
                <Button 
                    onClick={handleApply} 
                    disabled={isDisabled}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t.apply}
                </Button>
                
                <Button
                    size="sm"
                    onClick={handleDownloadExcel}
                    disabled={isDownloading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200 gap-1.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Download detailed timesheet as Excel"
                >
                    <FileSpreadsheet 
                        size={16} 
                        className={isDownloading ? "animate-pulse" : "group-hover:scale-110 transition-transform duration-200"} 
                    />
                    {isDownloading ? "..." : "XLS"}
                </Button>
            </div>
        </div>
    </div>
    );
}
