
export enum SubmissionStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  LOCKED = "LOCKED",
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