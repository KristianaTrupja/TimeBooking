"use client";

import { useLanguage } from "@/app/context/LanguageContext";
import { Globe } from "lucide-react";

export default function HeaderLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
      <Globe size={14} className="text-slate-500 ml-1" />
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
          language === "en"
            ? "bg-white text-slate-700 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("de")}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
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

