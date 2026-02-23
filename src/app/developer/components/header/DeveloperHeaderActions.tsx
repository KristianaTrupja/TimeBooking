"use client";

import HeaderLanguageSwitcher from "@/components/ui/HeaderLanguageSwitcher";
import { useLanguage } from "@/app/context/LanguageContext";

interface DeveloperHeaderActionsProps {
  displayedUsername: string;
  displayedRole: string;
}

export default function DeveloperHeaderActions({ displayedUsername, displayedRole }: DeveloperHeaderActionsProps) {
  const { t } = useLanguage();
  
  const normalizedRole = displayedRole?.toLowerCase();
  const roleLabel =
    normalizedRole === "admin"
      ? t.admin
      : normalizedRole === "employee"
      ? t.employee
      : t.developer;
  
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <HeaderLanguageSwitcher />
      <div className="hidden sm:block h-6 w-px bg-slate-200" />
      <div className="hidden md:flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h4 className="text-slate-700 font-medium text-base tracking-wide">
          {displayedUsername}
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
            {roleLabel}
          </span>
        </h4>
      </div>
    </div>
  );
}

