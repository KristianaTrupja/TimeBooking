"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import ProjectList from "./ProjectsList";
import ProjectsForm from "./ProjectsForm";
import { FormData, ProjectEntry } from "@/types/project";
import { toast, Toaster } from "sonner";
import Spinner from "@/components/ui/Spinner";
import { FolderKanban, Building2, Layers } from "lucide-react";

function formatSelectors(data: ProjectEntry[]): Record<string, ProjectEntry[]> {
  return data.reduce((acc, entry) => {
    acc[entry.company] ??= [];
    
    if (!acc[entry.company].find(project => project.id === entry.id)) {
      acc[entry.company].push(entry);
    }
    
    return acc;
  }, {} as Record<string, ProjectEntry[]>);
}


export default function Projects() {
  const [formData, setFormData] = useState<FormData>({ name: "", project: "" });
  const [selectors, setSelectors] = useState<Record<string, ProjectEntry[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projectList")
      .then((res) => res.json())
      .then((jsonData) => {
        if (!Array.isArray(jsonData)) {
          console.error("Expected an array but got:", jsonData);
          return;
        }
        setSelectors(formatSelectors(jsonData));
      })
      .catch((err) => console.error("Failed to fetch projects", err))
      .finally(() => { setTimeout(() => { setIsLoading(false);}, 500);});
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const nameInput = formData.name.trim();
      const projectInput = formData.project.trim();

      if (!nameInput || !projectInput) {
        toast.error("Please, fill in both fields!");
        return;
      }

      const existingCompanyKey = Object.keys(selectors)
        .find(key => key.toLowerCase() === nameInput.toLowerCase());

      if (existingCompanyKey) {
        const projectExists = selectors[existingCompanyKey]
          .some(p => p.project.toLowerCase() === projectInput.toLowerCase());

        if (projectExists) {
          toast.error("This project already exists!");
          return;
        }
      }

      try {
        const response = await fetch("/api/projectList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ company: nameInput, project: projectInput }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to save project to backend");
        }

        const res = await fetch("/api/projectList");
        const jsonData = await res.json();
        setSelectors(formatSelectors(jsonData));

        toast.success("Project was added successfully");
        setFormData({ name: "", project: "" });
      } catch (error: any) {
        console.error("Error saving project:", error);
        toast.error(error.message || "An error occurred while attempting to add the project.");
      }
    },
    [formData, selectors]
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
  } else if (operation === "delete") {
    const response = await fetch(`/api/projectList?projectId=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to delete project");
    }
  }

  const res = await fetch("/api/projectList");
  const jsonData = await res.json();
  setSelectors(formatSelectors(jsonData));
}, []);



  // Stats
  const stats = useMemo(() => {
    const companies = Object.keys(selectors);
    const projects = Object.values(selectors).flat();
    return { companies: companies.length, projects: projects.length };
  }, [selectors]);

  if(isLoading) return (
    <div className="h-full">
      <Spinner text="Loading projects..." />
    </div>
  );

  return (
    <section className="p-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <FolderKanban className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Project Management</h1>
            <p className="text-sm text-slate-600">Organize companies and their projects</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto pb-4 custom-scrollbar">
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
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            existingCompanies={Object.keys(selectors)}
          />
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </section>
  );
}
