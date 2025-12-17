import React, { useRef, useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { useLanguage } from "@/app/context/LanguageContext";

type AbsPopoverData = {
    currentYear: { year:number, daysLeft:number, daysSpent:number },
    lastYear: { year:number, daysLeft:number, daysSpent:number }
    totalDaysLeft: number
}

type AbsPopoverProps = {
    data: AbsPopoverData
}


export default function AbsPopover({ data }:AbsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { t } = useLanguage();

    const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    // to prevent flickering
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 100)
  }

  return (
    <Popover className="relative border-b-2 border-dotted border-b-[#244B77] text-sm h-fit text-[#244B77]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
    >
        <PopoverButton className="outline-none">
            {t.vacationsLeft}:
            <span className="font-bold">
                <span> {data.totalDaysLeft} {data.totalDaysLeft === 1 ? t.day : t.days}</span>
            </span>
        </PopoverButton>
        <PopoverPanel
        static={isOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        anchor={{ to: 'bottom start', gap: '6px' }} transition
        className="flex origin-top flex-col w-52 bg-white
        shadow-[0px_0px_3px_rgba(0,0,0,0.2)] p-3 rounded-md
        text-sm h-fit text-[#244B77]
        transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0"
        >
            <table>
                <tr className="font-bold text-xs">
                    <td>{t.year}</td>
                    <td>{t.left}</td>
                    <td>{t.spent} ({new Date().getFullYear()})</td>
                </tr>
                <tr>
                    <td>{data.currentYear.year}</td>
                    <td className="text-center">{data.currentYear.daysLeft}</td>
                    <td className="text-center">{data.currentYear.daysSpent}</td>
                </tr>
                <tr>
                    <td>{data.lastYear.year}</td>
                    <td className="text-center">{data.lastYear.daysLeft}</td>
                    <td className="text-center">{data.lastYear.daysSpent}</td>
                </tr>
                <tr className="font-bold">
                    <td>{t.total}</td>
                    <td className="text-center">{data.totalDaysLeft}</td>
                    <td className="text-center">{data.currentYear.daysSpent + data.lastYear.daysSpent}</td>
                </tr>
            </table>
        </PopoverPanel>
    </Popover>
  )
}
