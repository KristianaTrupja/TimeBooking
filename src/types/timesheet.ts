import { Submission, SubmissionStatus } from "./submission"

export type Timesheet = {
    userId: number,
    username: string,
    email: string,
    role: string,
    submission: Submission | null,
    totalHours: number,
    status: keyof typeof SubmissionStatus,
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