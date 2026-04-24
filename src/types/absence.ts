import { User } from "./user";


export type Absence = {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedById?: number | null;
  reviewedAt?: string | null;
  userId: number;
  user: User
}

export interface ExtAbsence extends Absence {
  days: number,
  overlapBusinessDays: number
}

export enum AbsenceType {
  VACATION = "VACATION", 
  OFFICIAL_HOLIDAYS = "OFFICIAL_HOLIDAYS",
  SICK = "SICK", 
  OTHER = "OTHER",
}

export enum AbsenceStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type Filters = { 
  selectedAbsenceType: keyof typeof AbsenceType | null
  selectedEmployee: User | null
  startDate: Date
  endDate: Date
}
