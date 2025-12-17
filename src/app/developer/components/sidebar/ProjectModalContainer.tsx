import ProjectModal from "./ProjectModal";

export default function ProjectModalContainer({
  isModalOpen,
  closeModal,
  projectsData,
  selectedProjects,
  sidebarProjects,
  toggleSelection,
  handleSubmit,
  isSubmitting,
}: any){
    return(
        <ProjectModal
          isOpen={isModalOpen}
          onClose={closeModal}
          projectsData={projectsData}
          selectedProjects={selectedProjects}
          sidebarProjects={sidebarProjects}
          toggleProjectSelection={toggleSelection}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
    )
};

