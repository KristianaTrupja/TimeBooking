import type { Company as CompanyType } from "./company";

export type Company = CompanyType;

export interface FormData {
  companyId?: number;
  project: string;
}

export interface ProjectEntry {
  id: number;
  companyId: number;
  company: {
    id: number;
    name: string;
    isActive: boolean;
    deletedAt: Date | null;
  };
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
  companyId: number;
  projects: Project[];
};

