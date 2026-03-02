"use client";

import { useCalendar } from "@/app/context/CalendarContext";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthYearPicker() {
  const { setMonthAndYear, month, year } = useCalendar();
  const [activeYear, setActiveYear] = useState(year);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (m: number) => {
    setMonthAndYear(m, activeYear, true);
    setShowPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center relative">
      <button 
        onClick={() => setShowPicker((prev) => !prev)}
        aria-label="Open month and year picker"
        aria-expanded={showPicker}
        className="p-1 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#244B77] !min-w-7 !min-h-7 sm:!min-w-9 sm:!min-h-9"
      >
        <CalendarDays className="text-[#244B77]" size={16} aria-hidden="true" />
      </button>

      {showPicker && (
        <div 
          className="absolute top-full right-0 mt-2 z-50" 
          ref={pickerRef}
          role="dialog"
          aria-label="Select month and year"
        >
          <div className="bg-gradient-to-br from-[#244B77] to-[#1a3a5c] text-white rounded-xl p-4 shadow-xl shadow-[#244B77]/20 border border-white/10 min-w-[260px]">
            {/* Year Navigation */}
            <div className="flex justify-between items-center mb-4 px-1">
              <button 
                onClick={() => setActiveYear((y) => y - 1)}
                aria-label="Previous year"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <span className="font-bold text-lg" aria-live="polite">{activeYear}</span>
              <button 
                onClick={() => setActiveYear((y) => y + 1)}
                aria-label="Next year"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
            
            {/* Month Grid */}
            <div className="grid grid-cols-4 gap-2" role="listbox" aria-label="Select month">
              {months.map((name, idx) => {
                const isSelected = activeYear === year && idx === month;
                return (
                  <button
                    key={name}
                    onClick={() => handleSelect(idx)}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${name} ${activeYear}`}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                      isSelected
                        ? "bg-cyan-400 text-[#1a3a5c] shadow-md shadow-cyan-400/30"
                        : "hover:bg-white/10 text-white"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
