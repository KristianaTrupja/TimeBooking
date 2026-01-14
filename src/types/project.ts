export interface FormData {
  name: string;
  project: string;
}

export interface ProjectEntry {
  id: number;
  company: string;
  project: string;
  isActive: boolean;
  deletedAt: Date | null;
}
export type Project = {
  title: string;
  projectKey: string;
  isActive: boolean;
};

export type ProjectData = {
  company: string;
  projects: Project[];
};

