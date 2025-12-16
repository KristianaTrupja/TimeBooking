import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { ProjectData } from "@/types/project";
import clsx from "clsx";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectsData: ProjectData[];
  selectedProjects: string[];
  sidebarProjects: ProjectData[];
  toggleProjectSelection: (company: string, project: string) => void;
  handleSubmit: () => void;
}

export default function ProjectModal({
  isOpen,
  onClose,
  projectsData,
  selectedProjects,
  sidebarProjects,
  toggleProjectSelection,
  handleSubmit,
}: ProjectModalProps) {
  const sidebarProjectKeys = new Set(
    sidebarProjects.flatMap((group) =>
      group.projects.map((proj) => `${group.company}-${proj.projectKey}`)
    )
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose a project"
      footer={<Button onClick={handleSubmit}>Add</Button>}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {projectsData.sort((a, b) => a.company.localeCompare(b.company)).map(({ company, projects }) => (
          <div key={company}>
            <h4 className="font-semibold text-[#244B77] mb-2">{company}</h4>
            <ul className="space-y-1">
              {projects.map((project) => {
                const key = `${company}-${project.projectKey}`;
                const isAlreadyInSidebar = sidebarProjectKeys.has(key);
                const isSelected = selectedProjects.includes(key);

                return (
                  <li
                    key={project.projectKey}
                    onClick={() =>
                      !isAlreadyInSidebar && toggleProjectSelection(company, project.projectKey)
                    }
                    className={clsx(
                      "p-2 rounded",
                      isAlreadyInSidebar
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : isSelected
                        ? "bg-[#244B77] text-white cursor-pointer"
                        : "bg-blue-100 text-[#244B77] cursor-pointer"
                    )}
                  >
                    {project.title}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
