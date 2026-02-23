"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { Globe } from "lucide-react";

export default function HeaderLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 bg-slate-100 rounded-md sm:rounded-lg p-0.5">
      <Globe size={10} className="sm:w-3 sm:h-3 md:w-[14px] md:h-[14px] text-slate-500 ml-0.5" />
      <button
        onClick={() => setLanguage("en")}
        className={`px-1 sm:px-1.5 md:px-2 py-0.5 text-[9px] sm:text-[10px] md:text-xs font-medium rounded-sm sm:rounded-md transition-all duration-200 ${
          language === "en"
            ? "bg-white text-slate-700 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("de")}
        className={`px-1 sm:px-1.5 md:px-2 py-0.5 text-[9px] sm:text-[10px] md:text-xs font-medium rounded-sm sm:rounded-md transition-all duration-200 ${
          language === "de"
            ? "bg-white text-slate-700 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        DE
      </button>
    </div>
  );
}

