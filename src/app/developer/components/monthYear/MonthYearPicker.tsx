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
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <CalendarDays className="text-[#244B77]" size={20} />
      </button>

      {showPicker && (
        <div 
          className="absolute top-full right-0 mt-2 z-50" 
          ref={pickerRef}
        >
          <div className="bg-gradient-to-br from-[#244B77] to-[#1a3a5c] text-white rounded-xl p-4 shadow-xl shadow-[#244B77]/20 border border-white/10 min-w-[260px]">
            {/* Year Navigation */}
            <div className="flex justify-between items-center mb-4 px-1">
              <button 
                onClick={() => setActiveYear((y) => y - 1)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-bold text-lg">{activeYear}</span>
              <button 
                onClick={() => setActiveYear((y) => y + 1)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            {/* Month Grid */}
            <div className="grid grid-cols-4 gap-2">
              {months.map((name, idx) => {
                const isSelected = activeYear === year && idx === month;
                return (
                  <button
                    key={name}
                    onClick={() => handleSelect(idx)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "bg-cyan-400 text-[#1a3a5c] shadow-md shadow-cyan-400/30"
                        : "hover:bg-white/10 text-white/90"
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
