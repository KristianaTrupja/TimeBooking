'use client';

import { useState, useEffect } from 'react';
import { useProjects } from '@/app/context/ProjectContext';
import SidebarContent from './SidebarContent';
import ProjectModalContainer from './ProjectModalContainer';
import { ProjectData, ProjectEntry } from '@/types/project';
import { useWorkHours } from '@/app/context/WorkHoursContext';

export default function Sidebar({ isOwner }: { isOwner:boolean }) {
  const { setSidebarProjects, sidebarProjects } = useProjects();
  const { metadata } = useWorkHours()
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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



  return (
    <>
      <SidebarContent
        sidebarProjects={sidebarProjects}
        openModal={() => setIsModalOpen(true)}
        isLocked={metadata?.isLocked}
        isOwner={isOwner}
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
