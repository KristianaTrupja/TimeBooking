import Link from "next/link";
import { Button } from "@/components/ui/button";
import Dropdown from "@/components/ui/Dropdown";
import { useState, useEffect, useRef } from "react";
import { SubmissionStatus, Timesheet } from "@/types/timesheet";
import { Eye, Clock, User } from "lucide-react";

type PropTypes = {
    timesheet:Timesheet,
    month:number
    year:number
    index: number
    adminId: string | null
    onApply: (submissionId:number, status: keyof typeof SubmissionStatus) => Promise<void>
    shouldScrollTo?: boolean
    onScrollComplete?: () => void
}

// Status badge styles
const statusBadgeStyles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    LOCKED: "bg-slate-200 text-slate-700 border-slate-300"
}

// Row highlight for scroll-to effect
const scrollHighlight = "ring-2 ring-blue-400 ring-offset-2 bg-blue-50"

export default function RaportEntry({timesheet, month, year, index, adminId, onApply, shouldScrollTo = false, onScrollComplete}: PropTypes) {
    const [selectedStatus, setSelectedStatus] = useState(timesheet.status)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isHighlighted, setIsHighlighted] = useState(false)
    const rowRef = useRef<HTMLTableRowElement>(null);

    // Handle scroll-to effect
    useEffect(() => {
        if (shouldScrollTo && rowRef.current) {
            setIsHighlighted(true);
            const timer = setTimeout(() => {
                rowRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
                // Remove highlight after animation
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

    const isDisabled = !timesheet.submission || !timesheet.status || timesheet.status === "DRAFT" || isSubmitting;
    const statusStyle = statusBadgeStyles[timesheet.status || "DRAFT"];

    return (
    <tr
        ref={rowRef}
        className={`transition-all duration-300 hover:bg-slate-50 ${isHighlighted ? scrollHighlight : ""}`}
    >
        <td className="px-4 py-4">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {index + 1}
            </span>
        </td>
        <td className="px-4 py-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <User size={16} className="text-slate-600" />
                </div>
                <span className="font-bold text-slate-900">{timesheet.username}</span>
            </div>
        </td>
        <td className="px-4 py-4">
            <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
                <span className="font-bold text-slate-800">{timesheet.totalHours.toFixed(2)}</span>
                <span className="text-slate-500 text-sm">hrs</span>
            </div>
        </td>
        <td className="px-4 py-4">
            <Link href={`/developer/${timesheet.userId}?adminId=${adminId}&month=${month + 1}&year=${year}`}>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                >
                    <Eye size={14} />
                    View
                </Button>
            </Link>
        </td>
        <td className="px-4 py-4">
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
        </td>
        <td className="px-4 py-4">
            <Button 
                onClick={handleApply} 
                disabled={isDisabled}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Apply
            </Button>
        </td>
    </tr>
    );
}

