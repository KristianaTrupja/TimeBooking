"use client";
import { CalendarDays, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { getEndOfMonth, getStartOfMonth } from "@/app/utils/dateUtils";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DEFAULT_PRESET_LABEL = "Choose Period"
// New presets need to be added here
const PRESETS = [
  { 
    label: "Last 3 months", 
    logic: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return { startDate: getStartOfMonth(start), endDate: getEndOfMonth(end) }
    }
  },
  { 
    label: "Last 6 months", 
    logic: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      return { startDate: getStartOfMonth(start), endDate: getEndOfMonth(end) }
    }
  },
  { 
    label: "Last Year", 
    logic: () => {
      const now = new Date();
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { startDate: start, endDate: end }
    }
  },
  { 
    label: "Current Year", 
    logic: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1)
      const end = new Date()
      return { startDate: start, endDate: getEndOfMonth(end) }
    }
  },
]
export default function DateFilter({ onChange }: { onChange: (range: { startDate: Date; endDate: Date }) => void }) {
    const today = new Date()
    const [startDate, setStartDate] = useState(new Date(today.getFullYear(), 0, 1))
    const [endDate, setEndDate] = useState(getEndOfMonth(today))
    const [activeYear, setActiveYear] = useState(today.getFullYear())
    const [selectedPreset, setSelectedPreset] = useState(DEFAULT_PRESET_LABEL)

    function notifyChange(period: {startDate: Date, endDate: Date}) {
        onChange(period);
    }

    function formatDate(date:Date) {
      return new Date(date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      })
    }

    function handlePreset(label:string, dates:{startDate:Date, endDate:Date}){
      setStartDate(dates.startDate)
      setEndDate(dates.endDate)
      setSelectedPreset(label)
      notifyChange(dates)
    }

    function chooseStartDate(m: number) {
      const now = new Date()
      const newStartDate = new Date(activeYear, m, 1)
      if(newStartDate > getEndOfMonth(now)) return
      if(newStartDate > endDate) setEndDate(getEndOfMonth(newStartDate))
      setStartDate(newStartDate)
      setSelectedPreset(DEFAULT_PRESET_LABEL)
      notifyChange({startDate:newStartDate, endDate})
    }

    function chooseEndDate(m: number) {
      const now = new Date()
      const newEndDate = getEndOfMonth(new Date(activeYear, m,1))
      if(newEndDate > getEndOfMonth(now)) return
      if(newEndDate < startDate) return
      setEndDate(newEndDate)
      notifyChange({startDate, endDate:newEndDate})
      setSelectedPreset(DEFAULT_PRESET_LABEL)
    }

  return (
    <div className="DateFilter flex w-fit">
      {/* Presets */}
      <Menu as="div" className="relative inline-block text-[#244B77]">
        <MenuButton className="inline-flex w-full outline-1 outline-black/5 justify-center data-closed:text-red-400 gap-x-1.5 px-3 py-2 text-sm font-semibold inset-ring-1 inset-ring-white/5">
          <CalendarDays aria-hidden="true" className=" mr-1 size-5 text-[#6C99CB]" />
          {selectedPreset}
        </MenuButton>

        <MenuItems
          className="absolute right-0 z-50 min-w-40 w-fit origin-top-left rounded-md bg-white shadow-[1px_2px_4px_rgba(0,0,0,0.25)] outline-none transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
        >
          <div className="py-1">
            {PRESETS.map(({label, logic}, index) => (
              <MenuItem key={index}>
                <a href="#" onClick={() => handlePreset(label, logic())} className="block text-nowrap hover:bg-[#E3F0FF] px-4 py-2 text-sm data-focus:bg-white/5 data-focus:text-white data-focus:outline-hidden">
                  {label}
                </a>
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Menu>
      {/* Start Date */}
      <Menu as="div" className="relative inline-block text-[#244B77]">
        <MenuButton className="inline-flex w-full outline-1 outline-black/5 justify-center data-closed:text-red-400 gap-x-1.5 px-3 py-2 text-sm font-semibold inset-ring-1 inset-ring-white/5">
          {formatDate(startDate)}
        </MenuButton>

        <MenuItems
          className="absolute right-0 z-50 min-w-40 w-fit origin-top-left rounded-md bg-white shadow-[1px_2px_4px_rgba(0,0,0,0.25)] outline-none transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
        >
          <div className="py-1">
              <div>
                <div className="p-4 min-w-[240px] w-fit">
                  <div className="flex justify-end gap-2 items-center mb-2 w-full">
                    <button onClick={() => setActiveYear((y) => y - 1)}>
                      <ChevronDown className="hover:text-[#6C99CB] active:text-[#244B77]" />
                    </button>
                    <span className="font-bold text-lg min-w-10">{activeYear}</span>
                    <button onClick={() => setActiveYear((y) => y + 1)}>
                      <ChevronUp className="hover:text-[#6C99CB] active:text-[#244B77]" />
                    </button>
                  </div>
                  <MenuItem>
                    <div className="grid grid-cols-4 gap-2 w-fit">
                      {months.map((name, monthIndex) => {
                        const isFuture = new Date(activeYear, monthIndex, 1) > getEndOfMonth(today)
                        return <button
                          key={name}
                          onClick={() => chooseStartDate(monthIndex)}
                          className={`py-1 px-2 rounded
                            ${isFuture ? 'text-black/40 bg-red-400/5 cursor-not-allowed' : 'hover:bg-[#E3F0FF]'}
                          `}>
                          {name}
                        </button>
                        })}
                    </div>
                  </MenuItem>
                </div>
              </div>
          </div>
        </MenuItems>
      </Menu>
      {/* End Date */}
      <Menu as="div" className="relative inline-block text-[#244B77]">
        <MenuButton className="inline-flex w-full outline-1 outline-black/5 justify-center data-closed:text-red-400 gap-x-1.5 px-3 py-2 text-sm font-semibold inset-ring-1 inset-ring-white/5">
          {formatDate(endDate)}
        </MenuButton>

        <MenuItems
          className="absolute right-0 z-50 min-w-40 w-fit origin-top-left rounded-md bg-white shadow-[1px_2px_4px_rgba(0,0,0,0.25)] outline-none transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
        >
          <div className="py-1">
              <div>
                <div className="p-4 min-w-[240px] w-fit">
                  <div className="flex justify-end gap-2 items-center mb-2 w-full">
                    <button onClick={() => setActiveYear((y) => y - 1)}>
                      <ChevronDown className="hover:text-[#6C99CB] active:text-[#244B77]" />
                    </button>
                    <span className="font-bold text-lg min-w-10">{activeYear}</span>
                    <button onClick={() => setActiveYear((y) => y + 1)}>
                      <ChevronUp className="hover:text-[#6C99CB] active:text-[#244B77]" />
                    </button>
                  </div>
                  <MenuItem>
                    <div className="grid grid-cols-4 gap-2 w-fit">
                      {months.map((name, monthIndex) => {
                        const newEndDate = getEndOfMonth(new Date(activeYear, monthIndex, 1));
                        const isFuture = newEndDate > getEndOfMonth(today);
                        const isBeforeStartDate = newEndDate < startDate;
                        return <button
                          key={name}
                          onClick={() => chooseEndDate(monthIndex)}
                          className={`py-1 px-2 rounded
                            ${isFuture || isBeforeStartDate ? 'text-black/40 bg-red-400/5 cursor-not-allowed' : 'hover:bg-[#E3F0FF]'}
                          `}>
                          {name}
                        </button>
                      })}
                    </div>
                  </MenuItem>
                </div>
              </div>
          </div>
        </MenuItems>
      </Menu>
    </div>
  )
}
