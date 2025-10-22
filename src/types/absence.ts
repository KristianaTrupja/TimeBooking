import { User } from "./user";


export type Absence = {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  userId: number;
  user: User
}

export interface ExtAbsence extends Absence {
  days: number,
  overlapBusinessDays: number
}

export enum AbsenceType {
  VACATION = "VACATION", 
  SICK = "SICK", 
  PERSONAL = "PERSONAL", 
  PARENTAL = "PARENTAL"
}

export type Filters = { 
  selectedAbsenceType: keyof typeof AbsenceType | null
  selectedEmployee: User | null
  startDate: Date
  endDate: Date
}