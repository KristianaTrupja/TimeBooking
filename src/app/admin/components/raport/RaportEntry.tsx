import Link from "next/link";
import { Button } from "@/components/ui/button";
import Dropdown from "@/components/ui/Dropdown";
import { useState, useEffect, useRef } from "react";
import { SubmissionStatus, Timesheet } from "@/types/timesheet";

type PropTypes = {
    timesheet:Timesheet,
    month:number
    year:number
    index: number
    onApply: (submissionId:number, status: keyof typeof SubmissionStatus) => Promise<void>
    shouldScrollTo?: boolean
    onScrollComplete?: () => void
}

// Border colors for status dropdown
const statusBorderColors: Record<string, string | null> = {
    DRAFT: null,
    PENDING: "border-l-[7px] border-l-yellow-500",
    APPROVED: "border-l-[7px] border-l-green-500",
    REJECTED: "border-l-[7px] border-l-red-500",
    LOCKED: "border-l-[7px] border-l-slate-500"
}

// Row background colors for highlighting
const rowBackgroundColors: Record<string, string> = {
    DRAFT: "bg-[#E3F0FF]",
    PENDING: "bg-yellow-100",
    APPROVED: "bg-[#E3F0FF]",
    REJECTED: "bg-[#E3F0FF]",
    LOCKED: "bg-slate-200"
}

export default function RaportEntry({timesheet, month, year, index, onApply, shouldScrollTo = false, onScrollComplete}: PropTypes) {
    const [selectedStatus, setSelectedStatus] = useState(timesheet.status)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const rowRef = useRef<HTMLTableRowElement>(null);

    const rowBgColor = rowBackgroundColors[timesheet.status || "DRAFT"] || "bg-[#E3F0FF]";

    // Handle scroll-to effect
    useEffect(() => {
        if (shouldScrollTo && rowRef.current) {
            // Small delay to ensure the table is rendered
            const timer = setTimeout(() => {
                rowRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
                onScrollComplete?.();
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
    return (
    <tr
        ref={rowRef}
        className={`border-t border-[#d1d1d1] font-semibold text-lg ${rowBgColor}`}
    >
        <td className="px-4 py-2 bg-[#244B77] text-white font-semibold rounded-sm text-xl">
        {index + 1}.
        </td>
        <td className="px-4 py-2 rounded-sm">{timesheet.username}</td>
        <td className="px-4 py-2 rounded-sm">{timesheet.totalHours.toFixed(2)}</td>
        <td className="px-4 py-2 rounded-sm">
        <Link href={`/developer/${timesheet.userId}?adminId=null&month=${month + 1}&year=${year}`}>
            <Button
            variant="secondary"
            className="font-semibold w-full justify-start pl-10"
            >
            View timesheet
            </Button>
        </Link>
        </td>
        <td>
            <div className={`flex mx-2 bg-white "text-[#244B77]" ${statusBorderColors[timesheet.status || "DRAFT"]} whitespace-nowrap cursor-pointer rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 shadow-xs font-semibold `}>
                <Dropdown
                values={Object.values(SubmissionStatus)}
                value={selectedStatus}
                formatValues={v => v}
                selectedValue={v => v || "DRAFT"}
                onSelect={(value) => {setSelectedStatus(value || "DRAFT")}}
                hasAllOption={false}
                isDisabled={!timesheet.submission || !timesheet.status || timesheet.status === "DRAFT" || isSubmitting}
                />
            </div>
        </td>
        <td>
            <div className="flex mx-2 whitespace-nowrap cursor-pointer rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 bg-white text-[#244B77] shadow-xs font-semibold ">
                <Button onClick={handleApply} disabled={!timesheet.submission || !timesheet.status || timesheet.status === "DRAFT" || isSubmitting}>Apply</Button>
            </div>
        </td>
    </tr>
    );
}

