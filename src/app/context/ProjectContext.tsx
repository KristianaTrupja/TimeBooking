"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { ProjectData } from "@/types/project";
import { useCalendar } from "./CalendarContext";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

type ProjectContextType = {
  sidebarProjects: ProjectData[];
  setSidebarProjects: (projects: ProjectData[]) => void;
  allProjectKeys: string[];
  removeProject: (projectKey: string) => void;
  loadingProjects: boolean;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);


export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const userId = pathname.split("/")[2];

  const { month, year } = useCalendar();
  const [sidebarProjects, setSidebarProjectsState] = useState<ProjectData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const fetchSidebarProjects = useCallback(async () => {
    if (!userId) return;
    setLoadingProjects(true)

    try {
      const res = await fetch(`/api/sidebarProjects?userId=${userId}&month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed to load sidebar projects");
      const data: ProjectData[] = await res.json();
      setSidebarProjectsState(data);
      setTimeout(() => {
        setLoadingProjects(false)
      }, 1000);
    } catch (error) {
      console.error("Error fetching sidebar projects:", error);
      setLoadingProjects(false)
    }
  }, [userId, month, year]);


const setSidebarProjects = useCallback(async (projects: ProjectData[]) => {
  try {
    const response = await fetch("/api/sidebarProjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, projects, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save projects");
    }

    setSidebarProjectsState(projects);
    toast.success("Projects saved successfully");
    
  } catch (err) {
    console.error("Error saving sidebar projects:", err);
    toast.error(err instanceof Error ? err.message : "Failed to save projects");
  }
}, [month, year, userId])


  const removeProject = useCallback((projectKey: string) => {
    const updated = sidebarProjects
      .map(group => ({
        ...group,
        projects: group.projects.filter(p => p.projectKey !== projectKey),
      }))
      .filter(group => group.projects.length > 0);

    setSidebarProjects(updated);
  }, [sidebarProjects, setSidebarProjects]);

  const allProjectKeys = sidebarProjects?.flatMap(p =>
    p.projects?.map(proj => proj.projectKey)
  );

  // 🔁 Refetch when user changes
  useEffect(() => {
    fetchSidebarProjects();
  }, [fetchSidebarProjects]);

  return (
    <ProjectContext.Provider
      value={{
        sidebarProjects,
        setSidebarProjects,
        allProjectKeys,
        removeProject,
        loadingProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};
