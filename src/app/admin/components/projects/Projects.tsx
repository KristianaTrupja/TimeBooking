"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import ProjectList from "./ProjectsList";
import ProjectsForm from "./ProjectsForm";
import { FormData, ProjectEntry, Company } from "@/types/project";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";
import { FolderKanban } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

function formatSelectors(data: ProjectEntry[]): Record<string, ProjectEntry[]> {
  return data.reduce((acc, entry) => {
    const companyName = entry.company.name;
    acc[companyName] ??= [];
    
    if (!acc[companyName].find(project => project.id === entry.id)) {
      acc[companyName].push(entry);
    }
    
    return acc;
  }, {} as Record<string, ProjectEntry[]>);
}


export default function Projects() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<FormData>({ companyId: undefined, project: "" });
  const [selectors, setSelectors] = useState<Record<string, ProjectEntry[]>>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/projectList?includeInactive=true").then(res => res.json()),
      fetch("/api/companies?includeInactive=true").then(res => res.json())
    ])
      .then(([projectsData, companiesData]) => {
        if (!Array.isArray(projectsData)) {
          console.error("Expected projects array but got:", projectsData);
          return;
        }
        if (!Array.isArray(companiesData)) {
          console.error("Expected companies array but got:", companiesData);
          return;
        }
        setSelectors(formatSelectors(projectsData));
        setCompanies(companiesData);
      })
      .catch((err) => console.error("Failed to fetch data", err))
      .finally(() => { setTimeout(() => { setIsLoading(false);}, 500);});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'companyId' ? Number(value) : value 
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const projectInput = formData.project.trim();

      if (!formData.companyId || !projectInput) {
        toast.error("Please select a company and enter a project name!");
        return;
      }

      // Check if project already exists for this company
      const company = companies.find(c => c.id === formData.companyId);
      const companyName = company?.name || "";
      const existingProjects = selectors[companyName] || [];
      
      const projectExists = existingProjects
        .filter(p => p.isActive)
        .some(p => p.project.toLowerCase() === projectInput.toLowerCase());

      if (projectExists) {
        toast.error("This project already exists for this company!");
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/projectList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            company: companyName, // Send company name for API compatibility
            project: projectInput 
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to save project to backend");
        }

        fetchData();
        toast.success("Project was added successfully");
        setFormData({ companyId: undefined, project: "" });
      } catch (error: any) {
        console.error("Error saving project:", error);
        toast.error(error.message || "An error occurred while attempting to add the project.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, selectors, companies, fetchData]
  );


const onOptionsModified = useCallback(async (id: number, newValue: string, operation: "update" | "delete"): Promise<void> => {
  if (operation === "update") {
    const response = await fetch(`/api/projectList?projectId=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ project: newValue })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to update project");
    }
    toast.success("Project updated successfully");
  } else if (operation === "delete") {
    const response = await fetch(`/api/projectList?projectId=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to delete project");
    }
    
    const data = await response.json();
    toast.success(data.message);
  }

  fetchData();
}, [fetchData]);



  // Stats
  const stats = useMemo(() => {
    const companies = Object.keys(selectors);
    const projects = Object.values(selectors).flat();
    return { companies: companies.length, projects: projects.length };
  }, [selectors]);

  if(isLoading) return (
    <div className="h-full">
      <Spinner text={t.loadingProjects} />
    </div>
  );

  return (
    <section className="p-3 py-6 sm:p-6 h-full flex flex-col overflow-y-visible lg:overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <FolderKanban className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t.projectManagement}</h1>
            <p className="text-sm text-slate-600">{t.organizeCompanies}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-visible lg:overflow-y-auto pb-4 custom-scrollbar">
        {/* Projects List */}
        <div className="w-full lg:w-1/2 xl:w-3/5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <ProjectList
            selectors={selectors}
            onOptionsModified={onOptionsModified}
          />
        </div>

        {/* Add Project Form */}
        <div className="w-full lg:flex-1 flex items-start justify-center pb-6 lg:pb-0 lg:sticky lg:top-0">
          <ProjectsForm
            formData={formData}
            companies={companies}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </section>
  );
}
