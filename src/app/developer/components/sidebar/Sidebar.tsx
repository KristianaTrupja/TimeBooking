'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProjects } from '@/app/context/ProjectContext';
import SidebarContent from './SidebarContent';
import ProjectModalContainer from './ProjectModalContainer';
import { ProjectData, ProjectEntry } from '@/types/project';
import { useWorkHours } from '@/app/context/WorkHoursContext';
import { useCalendar } from '@/app/context/CalendarContext';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/app/context/LanguageContext';
import { toast } from 'sonner';

export default function Sidebar({ isOwner }: { isOwner:boolean }) {
  const { setSidebarProjects, sidebarProjects } = useProjects();
  const { metadata, reloadWorkHours } = useWorkHours();
  const { month, year } = useCalendar();
  const pathname = usePathname();
  const { t } = useLanguage();
  const userId = pathname.split("/")[2];
  
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const groupProjects = (entries: ProjectEntry[]): ProjectData[] => {
    const grouped = entries.reduce((acc, { id, company, project, isActive }) => {
      const companyName = company.name;
      if (!acc[companyName]) acc[companyName] = { companyId: company.id, projects: [] };
      acc[companyName].projects.push({ title: project, projectKey: `PID-${id}`, isActive });
      return acc;
    }, {} as Record<string, { companyId: number; projects: { title: string; projectKey: string; isActive: boolean }[] }>);

    return Object.entries(grouped).map(([company, { companyId, projects }]) => ({ 
      company, 
      companyId,
      projects 
    }));
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projectList');
        const data: ProjectEntry[] = await res.json();
        setProjectsData(groupProjects(data));
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };

    fetchProjects();
  }, []);

  const toggleProjectSelection = (company: string, projectKey: string) => {
    const key = `${company}-${projectKey}`;
    setSelectedProjects((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

const handleSubmit = async () => {
  const selected: ProjectData[] = projectsData
    .map(({ company, companyId, projects }) => {
      const filtered = projects.filter(p =>
        selectedProjects.includes(`${company}-${p.projectKey}`)
      );
      return filtered.length ? { company, companyId, projects: filtered } : null;
    })
    .filter(Boolean) as ProjectData[];

  const mergedMap: Record<string, { companyId: number; projects: Map<string, { title: string; isActive: boolean }> }> = {};

  [...sidebarProjects, ...selected].forEach(({ company, companyId, projects }) => {
    if (!mergedMap[company]) {
      mergedMap[company] = {
        companyId,
        projects: new Map()
      };
    }
    projects.forEach(({ projectKey, title, isActive }) =>
      mergedMap[company].projects.set(projectKey, { title, isActive })
    );
  });

  const mergedProjects: ProjectData[] = Object.entries(mergedMap).map(
    ([company, { companyId, projects }]) => ({
      company,
      companyId,
      projects: Array.from(projects.entries()).map(([projectKey, { title, isActive }]) => ({
        title,
        projectKey,
        isActive,
      })),
    })
  );

  setIsSubmitting(true);
  try {
    await setSidebarProjects(mergedProjects);
    setSelectedProjects([]);
    setIsModalOpen(false);
  } finally {
    setIsSubmitting(false);
  }
};

const handleCopyPreviousMonth = useCallback(async () => {
  if (isCopying) return;
  
  setIsCopying(true);
  toast.info(t.copying || 'Copying projects from previous month...');
  
  try {
    // Calculate previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = year - 1;
    }

    // Fetch sidebar projects from previous month
    const prevSidebarRes = await fetch(
      `/api/sidebarProjects?userId=${userId}&month=${prevMonth}&year=${prevYear}`,
      { cache: 'no-store' }
    );
    
    if (!prevSidebarRes.ok) {
      throw new Error('Failed to fetch previous month projects');
    }

    const prevSidebarProjects: ProjectData[] = await prevSidebarRes.json();
    
    if (prevSidebarProjects.length === 0) {
      toast.info('No projects found in previous month');
      return;
    }

    // Merge with current sidebar projects
    const mergedMap: Record<string, { companyId: number; projects: Map<string, { title: string; isActive: boolean }> }> = {};

    [...sidebarProjects, ...prevSidebarProjects].forEach(({ company, companyId, projects }) => {
      if (!mergedMap[company]) {
        mergedMap[company] = {
          companyId,
          projects: new Map()
        };
      }
      projects.forEach(({ projectKey, title, isActive }) =>
        mergedMap[company].projects.set(projectKey, { title, isActive })
      );
    });

    const mergedProjects: ProjectData[] = Object.entries(mergedMap).map(
      ([company, { companyId, projects }]) => ({
        company,
        companyId,
        projects: Array.from(projects.entries()).map(([projectKey, { title, isActive }]) => ({
          title,
          projectKey,
          isActive,
        })),
      })
    );

    // Save merged projects to current month
    await setSidebarProjects(mergedProjects);
    
    const addedCount = prevSidebarProjects.reduce((sum, company) => sum + company.projects.length, 0);
    toast.success(`Successfully copied ${addedCount} project(s) from previous month`);
  } catch (error) {
    console.error('Error copying projects:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to copy projects');
  } finally {
    setIsCopying(false);
  }
}, [month, year, userId, sidebarProjects, setSidebarProjects, isCopying, t]);



  return (
    <>
      <SidebarContent
        sidebarProjects={sidebarProjects}
        openModal={() => setIsModalOpen(true)}
        onCopyPreviousMonth={handleCopyPreviousMonth}
        isLocked={metadata?.isLocked}
        isOwner={isOwner}
        isCopying={isCopying}
      />
      <ProjectModalContainer
        isModalOpen={isModalOpen}
        closeModal={() => {
          setSelectedProjects([]);
          setIsModalOpen(false);
        }}
        projectsData={projectsData}
        selectedProjects={selectedProjects}
        sidebarProjects={sidebarProjects}
        toggleSelection={toggleProjectSelection}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
