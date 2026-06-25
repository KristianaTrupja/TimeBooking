import nodemailer from "nodemailer";

/**
 * Create nodemailer transporter for Gmail SMTP
 * @returns Configured transporter
 */
function createTransporter() {
  console.log("[email] createTransporter: OUTLOOK_USER set:", !!process.env.OUTLOOK_USER);
  console.log("[email] createTransporter: OUTLOOK_PASSWORD set:", !!process.env.OUTLOOK_PASSWORD);

  if (!process.env.OUTLOOK_USER || !process.env.OUTLOOK_PASSWORD) {
    console.error("[email] createTransporter: Missing SMTP credentials — aborting");
    throw new Error(
      "Outlook credentials not configured. Please set OUTLOOK_USER and OUTLOOK_PASSWORD environment variables.",
    );
  }

  return nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.OUTLOOK_USER,
      pass: process.env.OUTLOOK_PASSWORD,
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
  const recipients = Array.isArray(to) ? to.join(", ") : to;
  console.log("[email] sendEmail: attempting to send");
  console.log("[email] sendEmail: to =", recipients);
  console.log("[email] sendEmail: subject =", subject);

  try {
    const transporter = createTransporter();
    const fromEmail = process.env.OUTLOOK_USER || "noreply@outlook.com";

    console.log("[email] sendEmail: from =", fromEmail);

    const info = await transporter.sendMail({
      from: `"Timesheets" <${fromEmail}>`,
      to: recipients,
      subject,
      text,
      html: html || text,
    });

    console.log("[email] sendEmail: SUCCESS — messageId:", info.messageId);
    console.log("[email] sendEmail: response:", info.response);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("[email] sendEmail: FAILED");
    console.error("[email] sendEmail: error message:", error.message);
    console.error("[email] sendEmail: error code:", error.code);
    console.error("[email] sendEmail: error stack:", error.stack);
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
  console.log("[email] sendTimesheetConfirmationEmail: developerName =", developerName, "| month =", month);
  console.log("[email] sendTimesheetConfirmationEmail: adminEmails =", adminEmails);

  if (adminEmails.length === 0) {
    console.warn("[email] sendTimesheetConfirmationEmail: no admin emails provided — skipping");
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
    console.log("[email] sendTimesheetConfirmationEmail: sent to", adminEmails.length, "admin(s)");
    return { success: true, sent: adminEmails.length, failed: 0 };
  } else {
    console.error("[email] sendTimesheetConfirmationEmail: failed — error:", result.error);
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
  console.log("[email] sendLeaveRequestEmailToAdmins: employee =", payload.employeeName, "| leaveType =", payload.leaveType);
  console.log("[email] sendLeaveRequestEmailToAdmins: period =", payload.startDate, "→", payload.endDate, "| days =", payload.businessDays);
  console.log("[email] sendLeaveRequestEmailToAdmins: adminEmails =", adminEmails);

  if (adminEmails.length === 0) {
    console.warn("[email] sendLeaveRequestEmailToAdmins: no admin emails provided — skipping");
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
    console.log("[email] sendLeaveRequestEmailToAdmins: sent to", adminEmails.length, "admin(s)");
    return { success: true, sent: adminEmails.length, failed: 0 };
  }
  console.error("[email] sendLeaveRequestEmailToAdmins: failed — error:", result.error);
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
  console.log("[email] sendLeaveDecisionEmailToEmployee: employee =", payload.employeeName, "| status =", payload.status);
  console.log("[email] sendLeaveDecisionEmailToEmployee: to =", employeeEmail, "| reviewer =", payload.reviewerName);

  if (!employeeEmail || employeeEmail.trim() === "") {
    console.warn("[email] sendLeaveDecisionEmailToEmployee: no employee email provided — skipping");
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
    console.log("[email] sendLeaveDecisionEmailToEmployee: sent to", employeeEmail);
    return { success: true, sent: 1, failed: 0 };
  }
  console.error("[email] sendLeaveDecisionEmailToEmployee: failed — error:", result.error);
  return { success: false, sent: 0, failed: 1 };
}
