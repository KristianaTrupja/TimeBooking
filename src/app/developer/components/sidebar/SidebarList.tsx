"use client";

import { ProjectData } from "@/types/project";
import SidebarItem from "./SidebarItem";
import { useProjects } from "@/app/context/ProjectContext";
import { FolderOpen } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

interface SidebarListProps {
  sidebarProjects: ProjectData[];
}

export default function SidebarList({ sidebarProjects }: SidebarListProps) {
  const { loadingProjects } = useProjects();
  const { t } = useLanguage();

  if (sidebarProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400">
        <FolderOpen size={32} className="mb-2 opacity-50" />
        <p className="text-sm">{t.noProjects}</p>
      </div>
    );
  }

  if (loadingProjects) {
    return null
  }

  return (
    <div className="overflow-auto custom-scrollbar">
      <div className="h-10 2xl:h-11 flex justify-center font-semibold text-white items-center bg-gradient-to-r from-[#244B77] to-[#1a3a5c] rounded-tl-xl">
        {t.projects}
      </div>
      {sidebarProjects.sort((a, b) => a.company.localeCompare(b.company)).map(({ company, projects }) => (
        <SidebarItem key={company} company={company} projects={projects} />
      ))}
    </div>
  );
}