import nodemailer from "nodemailer";

/**
 * Create nodemailer transporter for Gmail SMTP
 * @returns Configured transporter
 */
function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Send email using Gmail SMTP
 * @param to Recipient email address(es)
 * @param subject Email subject
 * @param text Plain text email content
 * @param html HTML email content (optional)
 * @returns Promise with success status and message ID
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  text: string,
  html?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter();
    const fromEmail = process.env.GMAIL_USER || "noreply@gmail.com";

    const info = await transporter.sendMail({
      from: `"Timesheets" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text,
      html: html || text,
    });

    console.log("Email sent successfully:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Send timesheet confirmation email to all admin users
 * @param adminEmails Array of admin email addresses
 * @param developerName Name of the developer who confirmed
 * @param month Formatted month string (e.g., "January 2025")
 * @returns Promise with success status and counts
 */
export async function sendTimesheetConfirmationEmail(
  adminEmails: string[],
  developerName: string,
  month: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  if (adminEmails.length === 0) {
    console.warn("No admin emails provided for timesheet confirmation notification");
    return { success: true, sent: 0, failed: 0 };
  }

  const subject = `Timesheet Confirmation - ${developerName}`;
  const text = `${developerName} submitted their timesheet for ${month}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="font-size: 16px;">
        <strong>${developerName}</strong> confirmed their timesheet for <strong>${month}</strong>.
      </p>
    </div>
  `;

  const result = await sendEmail(adminEmails, subject, text, html);

  if (result.success) {
    return { success: true, sent: adminEmails.length, failed: 0 };
  } else {
    return { success: false, sent: 0, failed: adminEmails.length };
  }
}

type LeaveDecisionStatus = "APPROVED" | "REJECTED";

/**
 * Send leave request notification email to all admin users.
 */
export async function sendLeaveRequestEmailToAdmins(
  adminEmails: string[],
  payload: {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    businessDays: number;
  }
): Promise<{ success: boolean; sent: number; failed: number }> {
  if (adminEmails.length === 0) {
    console.warn("No admin emails provided for leave request notification");
    return { success: true, sent: 0, failed: 0 };
  }

  const { employeeName, leaveType, startDate, endDate, businessDays } = payload;
  const dayLabel = businessDays === 1 ? "day" : "days";
  const leaveTypeLabel = leaveType.toLowerCase();

  const subject = `Leave Request - ${employeeName}`;
  const text = `${employeeName} requested ${businessDays} ${dayLabel} of ${leaveTypeLabel} (${startDate} - ${endDate}).`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="font-size: 16px;">
        <strong>${employeeName}</strong> requested
        <strong>${businessDays} ${dayLabel}</strong> of
        <strong>${leaveTypeLabel}</strong>.
      </p>
      <p style="font-size: 14px; margin-top: 8px;">
        Requested period: <strong>${startDate}</strong> to <strong>${endDate}</strong>
      </p>
    </div>
  `;

  const result = await sendEmail(adminEmails, subject, text, html);
  if (result.success) {
    return { success: true, sent: adminEmails.length, failed: 0 };
  }
  return { success: false, sent: 0, failed: adminEmails.length };
}

/**
 * Send leave decision (approved/rejected) email to employee.
 */
export async function sendLeaveDecisionEmailToEmployee(
  employeeEmail: string,
  payload: {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    businessDays: number;
    status: LeaveDecisionStatus;
    reviewerName: string;
  }
): Promise<{ success: boolean; sent: number; failed: number }> {
  if (!employeeEmail || employeeEmail.trim() === "") {
    console.warn("No employee email provided for leave decision notification");
    return { success: true, sent: 0, failed: 0 };
  }

  const { employeeName, leaveType, startDate, endDate, businessDays, status, reviewerName } = payload;
  const dayLabel = businessDays === 1 ? "day" : "days";
  const leaveTypeLabel = leaveType.toLowerCase();
  const statusLabel = status === "APPROVED" ? "approved" : "rejected";

  const subject = `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`;
  const text =
    `Hi ${employeeName}, your request for ${businessDays} ${dayLabel} of ${leaveTypeLabel} ` +
    `(${startDate} - ${endDate}) was ${statusLabel} by ${reviewerName}.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="font-size: 16px;">Hi <strong>${employeeName}</strong>,</p>
      <p style="font-size: 15px;">
        Your request for <strong>${businessDays} ${dayLabel}</strong> of
        <strong>${leaveTypeLabel}</strong> (${startDate} - ${endDate}) was
        <strong>${statusLabel}</strong> by <strong>${reviewerName}</strong>.
      </p>
    </div>
  `;

  const result = await sendEmail(employeeEmail, subject, text, html);
  if (result.success) {
    return { success: true, sent: 1, failed: 0 };
  }
  return { success: false, sent: 0, failed: 1 };
}




