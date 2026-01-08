# Gmail Email Setup Guide

## Overview
This application uses **nodemailer** with **Gmail SMTP** to send email notifications to all admin users when a developer confirms/submits their timesheet.

## Required Environment Variables

Add the following environment variables to your `.env.local` file (or your deployment environment):

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### Environment Variables Explained

- **GMAIL_USER**: Your Gmail address (e.g., `your-email@gmail.com`)
- **GMAIL_APP_PASSWORD**: Gmail App Password (not your regular password)

## Setting Up Gmail App Password

Gmail requires an **App Password** for SMTP authentication (especially if you have 2FA enabled). Here's how to create one:

### Step 1: Enable 2-Step Verification (if not already enabled)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under **Signing in to Google**, check if **2-Step Verification** is enabled
3. If not enabled, click on it and follow the setup process

### Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under **Signing in to Google**, click on **2-Step Verification**
3. Scroll down and click on **App passwords**
4. You may need to sign in again
5. Select **Mail** as the app
6. Select **Other (Custom name)** as the device
7. Enter a name like "Timesheet App" and click **Generate**
8. **Copy the 16-character password** (you won't be able to see it again)
9. Use this password as your `GMAIL_APP_PASSWORD` value

**Important:** 
- The app password is 16 characters with no spaces
- If you have spaces, remove them
- This is different from your regular Gmail password

## Email Content

When a developer confirms their timesheet, all admin users will receive an email with:

**Subject:** `Timesheet Confirmation - {Developer Name}`

**Content:** `{Developer Name} confirmed their timesheet for {Month Year}`

Example:
- Subject: `Timesheet Confirmation - John Doe`
- Content: `John Doe confirmed their timesheet for January 2025`

## Testing

To test if your email configuration is working:

1. Ensure all environment variables are set
2. Submit a timesheet as a developer
3. Check the server logs for email sending status
4. Verify that admin users receive the email in their inbox

## Troubleshooting

### "Gmail credentials not configured" Error

Ensure both `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in your environment variables.

### "Invalid login" or Authentication Failed

1. **Verify App Password**: Make sure you're using the App Password, not your regular Gmail password
2. **Check 2-Step Verification**: Ensure 2-Step Verification is enabled on your Google account
3. **Regenerate App Password**: If the password doesn't work, generate a new one
4. **Remove Spaces**: Ensure there are no spaces in the app password

### "Less secure app access" Error

If you see this error, it means:
- You're trying to use your regular password instead of an App Password
- Generate and use an App Password instead

### Emails Not Being Sent

1. **Check server logs**: Look for error messages in the console
2. **Verify admin emails**: Ensure there are users with role "Admin" and valid email addresses in the database
3. **Check Gmail account**: Make sure the Gmail account is active and not restricted
4. **Check spam folder**: Emails might be going to spam

### Rate Limiting

Gmail has sending limits:
- **Free Gmail**: 500 emails per day
- **Google Workspace**: Higher limits depending on your plan

If you hit the limit, you'll see an error. Wait 24 hours or consider using a dedicated email service for production.

## Production Considerations

For production environments, consider:

1. **Dedicated Email Service**: Use services like SendGrid, Resend, or Mailgun for better deliverability
2. **Email Queue**: Implement a queue system for high-volume sending
3. **Error Monitoring**: Set up proper error logging and monitoring
4. **Email Templates**: Customize email templates for better branding

## Security Notes

- **Never commit** your Gmail credentials to version control
- Use environment variables for all sensitive data
- Rotate App Passwords regularly
- Consider using a dedicated Gmail account for sending automated emails (not a personal account)

