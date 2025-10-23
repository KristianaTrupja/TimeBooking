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

  const groupProjects = (entries: ProjectEntry[]): ProjectData[] => {
    const grouped = entries.reduce((acc, { id, company, project }) => {
      if (!acc[company]) acc[company] = [];
      acc[company].push({ title: project, projectKey: `PID-${id}` });
      return acc;
    }, {} as Record<string, { title: string; projectKey: string }[]>);

    return Object.entries(grouped).map(([company, projects]) => ({ company, projects }));
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

const handleSubmit = () => {
  const selected: ProjectData[] = projectsData
    .map(({ company, projects }) => {
      const filtered = projects.filter(p =>
        selectedProjects.includes(`${company}-${p.projectKey}`)
      );
      return filtered.length ? { company, projects: filtered } : null;
    })
    .filter(Boolean) as ProjectData[];

  const mergedMap: Record<string, Map<string, string>> = {};

  [...sidebarProjects, ...selected].forEach(({ company, projects }) => {
    if (!mergedMap[company]) mergedMap[company] = new Map();
    projects.forEach(({ projectKey, title }) =>
      mergedMap[company].set(projectKey, title)
    );
  });

  const mergedProjects: ProjectData[] = Object.entries(mergedMap).map(
    ([company, map]) => ({
      company,
      projects: Array.from(map.entries()).map(([projectKey, title]) => ({
        title,
        projectKey,
      })),
    })
  );

  setSidebarProjects(mergedProjects);
  setSelectedProjects([]);
  setIsModalOpen(false);
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
      />
    </>
  );
}
