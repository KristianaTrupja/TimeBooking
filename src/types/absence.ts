import { User } from "./user";


export type Absence = {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  userId: number;
}

export interface ExtAbsence extends Absence {
  businessDays: number
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