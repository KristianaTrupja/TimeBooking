"use client";
import React, { useState, useCallback, useEffect } from "react";
import ProjectList from "./ProjectsList";
import ProjectsForm from "./ProjectsForm";
import { FormData, ProjectEntry } from "@/types/project";
import { toast, Toaster } from "sonner";
import Spinner from "@/components/ui/Spinner";

function formatSelectors(data: ProjectEntry[]): Record<string, string[]> {
  return data.reduce((acc, { company, project }) => {
    if (!acc[company]) acc[company] = [];
    if (!acc[company].includes(project)) acc[company].push(project);
    return acc;
  }, {} as Record<string, string[]>);
}

export default function Projects() {
  const [openSelectorId, setOpenSelectorId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: "", project: "" });
  const [selectors, setSelectors] = useState<Record<string, string[]>>({});
  const [data, setData] = useState<ProjectEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projectList")
      .then((res) => res.json())
      .then((jsonData) => {
        if (!Array.isArray(jsonData)) {
          console.error("Expected an array but got:", jsonData);
          return;
        }
        setData(jsonData);
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
        toast.error("Ju lutem plotesoni te dy fushat!");
        return;
      }

      const existingCompanyKey = Object.keys(selectors).find(
        (key) => key.toLowerCase() === nameInput.toLowerCase()
      );

      let updatedSelectors = { ...selectors };

      if (existingCompanyKey) {
        if (!updatedSelectors[existingCompanyKey].includes(projectInput)) {
          updatedSelectors[existingCompanyKey] = [
            ...updatedSelectors[existingCompanyKey],
            projectInput,
          ];
        }
      } else {
        updatedSelectors[nameInput] = [projectInput];
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
          throw new Error("Failed to save project to backend");
        }

        const newEntry = await response.json();
        setData((prev) => [...prev, newEntry]);
        setSelectors(updatedSelectors);
        toast.success("Projekti u shtua me sukses");
        setFormData({ name: "", project: "" });
      } catch (error) {
        console.error("Error saving project:", error);
        toast.error("Ka ndodhur një gabim gjatë ruajtjes së projektit.");
      }
    },
    [formData, selectors]
  );

  const handleDelete = useCallback(
    async (company: string, project: string) => {
      const entryToDelete = data.find(
        (el) => el.company === company && el.project === project
      );

      if (!entryToDelete) {
        toast.error("Projekti nuk u gjet.");
        return;
      }

      try {
        const res = await fetch("/api/projectList", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: entryToDelete.id }),
        });

        if (!res.ok) {
          throw new Error("Failed to delete project");
        }

        toast.success("Projekti u fshi me sukses");

        // Update selectors
        setSelectors((prev) => {
          const updatedProjects = prev[company].filter((p) => p !== project);
          const updated = { ...prev };
          if (updatedProjects.length > 0) {
            updated[company] = updatedProjects;
          } else {
            delete updated[company];
          }
          return updated;
        });

        // Update local data
        setData((prev) =>
          prev.filter((el) => el.id !== entryToDelete.id)
        );
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("Ka ndodhur një gabim gjatë fshirjes së projektit.");
      }
    },
    [data]
  );

  const handleToggle = useCallback(
    (id: string) => {
      setOpenSelectorId((prev) => (prev === id ? null : id));
    },
    []
  );

  if(isLoading) return <Spinner/>

  return (
    <section className="flex gap-10 font-[var(--font-anek-bangla)]">
      {/* <Toaster position="top-center" /> */}
      <div className="bg-[#E3F0FF] w-1/2 2xl:w-1/3 h-[70vh] flex justify-center shadow-xl">
        <ProjectList
          selectors={selectors}
          openSelectorId={openSelectorId}
          handleToggle={handleToggle}
          handleDelete={handleDelete}
        />
      </div>
      <div className="mt-20">
        <h2 className="text-[#244B77] text-2xl 2xl:text-4xl font-bold mb-5">
          Deshironi te shtoni nje projekt te ri ne liste?
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
