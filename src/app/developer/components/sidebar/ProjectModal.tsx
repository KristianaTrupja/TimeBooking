"use client";

import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { ProjectData } from "@/types/project";
import { Building2, FolderPlus, Check, Lock } from "lucide-react";
import clsx from "clsx";
import { useLanguage } from "@/app/context/LanguageContext";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectsData: ProjectData[];
  selectedProjects: string[];
  sidebarProjects: ProjectData[];
  toggleProjectSelection: (company: string, project: string) => void;
  handleSubmit: () => void;
  isSubmitting?: boolean;
}

export default function ProjectModal({
  isOpen,
  onClose,
  projectsData,
  selectedProjects,
  sidebarProjects,
  toggleProjectSelection,
  handleSubmit,
  isSubmitting,
}: ProjectModalProps) {
  const { t } = useLanguage();
  
  const sidebarProjectKeys = new Set(
    sidebarProjects.flatMap((group) =>
      group.projects.map((proj) => `${group.company}-${proj.projectKey}`)
    )
  );

  const selectedCount = selectedProjects.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="z-[80]"
      title={
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#244B77] to-[#1a3a5c] flex items-center justify-center shadow-md">
            <FolderPlus className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{t.availableProjects}</h2>
            <p className="text-sm text-slate-400 font-normal">{t.selectProjects}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {selectedCount > 0 ? (
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#244B77] text-white text-xs flex items-center justify-center font-medium">
                  {selectedCount}
                </span>
                {t.projects.toLowerCase()}
              </span>
            ) : (
              t.noProjectsFound
            )}
          </span>
          <Button 
            onClick={handleSubmit}
            disabled={selectedCount === 0}
            loading={isSubmitting}
            className="bg-gradient-to-r from-[#244B77] to-[#1a3a5c] hover:from-[#2d5a8a] hover:to-[#244B77] text-white px-6 py-2 rounded-xl shadow-md shadow-[#244B77]/20 disabled:opacity-40 disabled:shadow-none transition-all"
          >
            <FolderPlus size={16} className="mr-2" />
            {t.addSelected}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 max-h-[55vh] overflow-y-auto custom-scrollbar pr-1">
        {projectsData.sort((a, b) => a.company.localeCompare(b.company)).map(({ company, projects }) => (
          <div key={company} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            {/* Company Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-[#244B77]/10 flex items-center justify-center">
                <Building2 size={14} className="text-[#244B77]" />
              </div>
              <h4 className="font-semibold text-[#244B77]">{company}</h4>
              <span className="text-xs text-slate-400 ml-auto">{projects.length} projects</span>
            </div>
            
            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projects.map((project) => {
                const key = `${company}-${project.projectKey}`;
                const isAlreadyInSidebar = sidebarProjectKeys.has(key);
                const isSelected = selectedProjects.includes(key);

                return (
                  <button
                    key={project.projectKey}
                    onClick={() =>
                      !isAlreadyInSidebar && toggleProjectSelection(company, project.projectKey)
                    }
                    disabled={isAlreadyInSidebar}
                    className={clsx(
                      "relative p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3",
                      isAlreadyInSidebar
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : isSelected
                        ? "bg-gradient-to-r from-[#244B77] to-[#1a3a5c] text-white shadow-md"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-[#244B77]/30 hover:shadow-sm"
                    )}
                  >
                    {/* Selection Indicator */}
                    <div className={clsx(
                      "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all",
                      isAlreadyInSidebar
                        ? "bg-slate-200"
                        : isSelected
                        ? "bg-cyan-400"
                        : "border-2 border-slate-300"
                    )}>
                      {isAlreadyInSidebar ? (
                        <Lock size={12} className="text-slate-400" />
                      ) : isSelected ? (
                        <Check size={12} className="text-[#1a3a5c]" />
                      ) : null}
                    </div>
                    
                    {/* Project Name */}
                    <span className={clsx(
                      "text-sm font-medium truncate"
                    )}>
                      {project.title}
                    </span>
                    
                    {/* Already Added Badge */}
                    {isAlreadyInSidebar && (
                      <span className="absolute top-1 right-1 text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                        Added
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        
        {projectsData.length === 0 && (
          <div className="text-center py-12">
            <FolderPlus size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400">{t.noProjectsFound}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
