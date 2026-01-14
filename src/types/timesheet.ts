
export type Timesheet = {
    userId: number,
    username: string,
    email: string,
    role: string,
    isActive: boolean,
    deletedAt: Date | null,
    submission: Submission | null,
    totalHours: number,
    status: keyof typeof SubmissionStatus,
}

export type MonthlyTimesheet = {
  submission: Submission | null;
  workhours: WorkHour[];
  metadata: {
    totalHours: number;
    isLocked: boolean;
    canEdit: boolean;
  };
}

export type Submission = {
  id:number
  userId:number
  periodStart:Date
  periodEnd:Date
  status: SubmissionStatus

  submittedAt:Date
  approvedAt?:Date
  rejectedAt?:Date

  approverId?:number
  rejectionReason?:string

  createdAt:Date
  updatedAt:Date
}

export enum SubmissionStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  LOCKED = "LOCKED",
}

export type TimesheetAPIData = {
    timesheets: Timesheet[]
    period: {
        month:number,
        year:number,
        periodStart:Date,
        periodEnd:Date,
    }
}

export type WorkHour = {
  id: number;
  date: string;
  hours: number;
  note: string | null;
  userId: number;
  projectId: number;
  submissionId: number | null;
  submission: Submission | null;
}