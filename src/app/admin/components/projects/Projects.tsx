"use client";
import React, { useState, useCallback, useEffect } from "react";
import ProjectList from "./ProjectsList";
import ProjectsForm from "./ProjectsForm";
import { FormData, ProjectEntry } from "@/types/project";
import { toast, Toaster } from "sonner";
import Spinner from "@/components/ui/Spinner";

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



  if(isLoading) return <Spinner/>

  return (
    <section className="flex gap-10 font-[var(--font-anek-bangla)]">
      {/* <Toaster position="top-center" /> */}
      <div className="bg-[#E3F0FF] w-1/2 2xl:w-1/3 h-[70vh] flex justify-center shadow-xl">
        <ProjectList
          selectors={selectors}
          onOptionsModified={onOptionsModified}
        />
      </div>
      <div className="mt-20">
        <h2 className="text-[#244B77] text-2xl 2xl:text-4xl font-bold mb-5">
          Would you like to add a new project to the list?
        </h2>
        <ProjectsForm
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
