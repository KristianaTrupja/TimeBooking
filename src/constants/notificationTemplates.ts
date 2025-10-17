
export const NotificationMessage = {
    /**
     * EXAMPLE: John Doe has submitted their timesheet for October 2025 and is awaiting your review.
     */
    TimesheetSubmitted: (employeeName: string, period: string) => 
        `${employeeName} has submitted their timesheet for ${period} and is awaiting your review.`,
    
    /**
     * EXAMPLE: Great news! John Doe approved your October 2025 timesheet.
     */
    TimesheetApproved: (reviewerName: string, period: string) => 
        `Great news! ${reviewerName} approved your ${period} timesheet.`,
    
    /**
     * EXAMPLE: Your October 2025 timesheet was rejected by John Doe. Please review the feedback and resubmit.
     */
    TimesheetRejected: (reviewerName: string, period: string) => 
        `Your ${period} timesheet was rejected by ${reviewerName}. Please review the feedback and resubmit.`,
    
    /**
     * EXAMPLE: Your October 2025 timesheet has been locked by John Doe and can no longer be modified.
     */
    TimesheetLocked: (reviewerName: string, period: string) => 
        `Your ${period} timesheet has been locked by ${reviewerName} and can no longer be modified.`,
    
    /**
     * EXAMPLE: John Doe updated Tinna Smith's October 2025 timesheet status to PENDING.
     */
    TimesheetStatusChange: (reviewerName: string, employeeName: string, period: string, status: string) => 
        `${reviewerName} updated ${employeeName}'s ${period} timesheet status to ${status}.`,
    
    /**
     * EXAMPLE: New team member added: Tinna Smith has been registered by John Doe.
     */
    UserCreated: (userName: string, adminName: string) => 
        `New team member added: ${userName} has been registered by ${adminName}.`,
    
    /**
     * EXAMPLE: Time-off approved: Tinna Smith will be away from 10/09/2025 to 15/09/2025.
     */
    AbsenceApproved: (employeeName: string, periodStart: string, periodEnd: string) => 
        `Time-off approved: ${employeeName} will be away from ${periodStart} to ${periodEnd}.`,
}
