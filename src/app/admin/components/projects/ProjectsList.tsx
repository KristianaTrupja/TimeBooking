import React from "react";
import { ProjectEntry } from "@/types/project";
import ProjectManage from "./ProjectManage";

interface ProjectListProps {
  selectors: { [key: string]: ProjectEntry[] };
  onOptionsModified: (id:number, newValue:string, operation: 'update'|'delete') => Promise<void>;
}

export default function ProjectList({
  selectors,
  onOptionsModified
}: ProjectListProps) {

  return (
    <div className="p-5 w-full mx-9 bg-white my-12 h-[60vh]">
      <h2 className="text-2xl text-[#244B77] font-bold text-left mb-3 mt-5">
        Lista e projekteve
      </h2>
      {Object.keys(selectors).sort((a, b) => a.localeCompare(b)).map((company) => (
        <div key={company} className="mb-3">
          <ProjectManage
            label={company}
            id={company}
            editable={true}
            options={selectors[company]}
            placeholder="View Projects"
            onOptionsModified={onOptionsModified}
          />
        </div>
      ))}
    </div>
  );
}
