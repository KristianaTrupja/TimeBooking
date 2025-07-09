"use client";

import { useCalendar } from "@/app/context/CalendarContext";
import { CalendarDays } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthYearPicker() {
  const { setMonthAndYear, month, year } = useCalendar();
  const [activeYear, setActiveYear] = useState(year);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (m: number) => {
    setMonthAndYear(m, activeYear, true);
    setShowPicker(false); // Close picker after selecting
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
    <div className="flex items-center space-x-2 relative">
      <button onClick={() => setShowPicker((prev) => !prev)}>
        <CalendarDays className="text-[#244B77]" />
      </button>

      {showPicker && (
        <div className="absolute top-6 left-0 z-10" ref={pickerRef}>
          <div className="bg-[#244B77] text-white rounded-md p-4 shadow-md min-w-[240px] w-fit">
            <div className="flex justify-between items-center mb-2 w-full">
              <button onClick={() => setActiveYear((y) => y - 1)}>«</button>
              <span className="font-bold text-lg">{activeYear}</span>
              <button onClick={() => setActiveYear((y) => y + 1)}>»</button>
            </div>
            <div className="grid grid-cols-4 gap-2 w-fit">
              {months.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => handleSelect(idx)}
                  className={`py-1 px-2 rounded hover:bg-[#6C99CB] ${
                    activeYear === year && idx === month ? "bg-[#6C99CB] font-semibold" : ""
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
