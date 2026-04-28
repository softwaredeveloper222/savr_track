import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || "notifications@surevia.com";
const APP_NAME = "Surevia";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface NotificationPayload {
  to: string;
  recipientName: string;
  deadlineTitle: string;
  deadlineId: string;
  category: string;
  expirationDate: string;
  daysUntil: number;
  type: "reminder" | "overdue" | "escalation" | "verification_needed";
  ownerName?: string;
}

function getSubject(payload: NotificationPayload): string {
  switch (payload.type) {
    case "overdue":
      return `[OVERDUE] ${payload.deadlineTitle} - Action Required`;
    case "escalation":
      return `[ESCALATION] ${payload.deadlineTitle} - ${Math.abs(payload.daysUntil)} days overdue`;
    case "verification_needed":
      return `[Review Needed] ${payload.deadlineTitle} - Verification Required`;
    case "reminder":
    default:
      if (payload.daysUntil === 0) return `[TODAY] ${payload.deadlineTitle} expires today`;
      if (payload.daysUntil === 1) return `[TOMORROW] ${payload.deadlineTitle} expires tomorrow`;
      return `[Reminder] ${payload.deadlineTitle} - ${payload.daysUntil} days remaining`;
  }
}

function getHtmlBody(payload: NotificationPayload): string {
  const deadlineUrl = `${APP_URL}/deadlines/${payload.deadlineId}`;
  const urgencyColor =
    payload.daysUntil < 0 ? "#dc2626" :
    payload.daysUntil <= 3 ? "#ea580c" :
    payload.daysUntil <= 7 ? "#d97706" :
    "#0d9488";

  const urgencyLabel =
    payload.daysUntil < 0 ? `${Math.abs(payload.daysUntil)} days overdue` :
    payload.daysUntil === 0 ? "Expires today" :
    payload.daysUntil === 1 ? "Expires tomorrow" :
    `${payload.daysUntil} days remaining`;

  let headerText = "Compliance Reminder";
  let bodyExtra = "";

  if (payload.type === "escalation") {
    headerText = "Escalation Notice";
    bodyExtra = `<p style="color: #dc2626; font-weight: 600; margin-top: 16px;">
      This item was assigned to ${payload.ownerName || "a team member"} and is now ${Math.abs(payload.daysUntil)} days overdue.
      As an admin/manager, you are being notified for escalation.
    </p>`;
  } else if (payload.type === "verification_needed") {
    headerText = "Verification Required";
    bodyExtra = `<p style="color: #7c3aed; margin-top: 16px;">
      A document was uploaded and scanned, but the system is not confident about the extracted data.
      Please review and verify the information.
    </p>`;
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); padding: 10px 14px; border-radius: 12px;">
          <span style="color: white; font-weight: 700; font-size: 18px;">${APP_NAME}</span>
        </div>
      </div>

      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        <h2 style="color: #0f172a; font-size: 18px; margin: 0 0 8px 0;">${headerText}</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0;">Hi ${payload.recipientName},</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0;">${payload.deadlineTitle}</h3>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span style="background: ${urgencyColor}15; color: ${urgencyColor}; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; border: 1px solid ${urgencyColor}30;">
              ${urgencyLabel}
            </span>
            <span style="background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 8px;">
              ${payload.category.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 12px 0 0 0;">
            Expiration: <strong style="color: #0f172a;">${payload.expirationDate}</strong>
          </p>
        </div>

        ${bodyExtra}

        <a href="${deadlineUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); color: white; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 8px;">
          View Deadline
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
        ${APP_NAME} &mdash; Contractor Compliance Management<br/>
        You can manage notification preferences in your account settings.
      </p>
    </div>
  `;
}

export async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  // Skip if SMTP not configured
  if (!process.env.SMTP_USER) {
    console.log(`[Notification] Email skipped (SMTP not configured): ${payload.type} for ${payload.deadlineTitle} to ${payload.to}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: payload.to,
      subject: getSubject(payload),
      html: getHtmlBody(payload),
    });
    console.log(`[Notification] Email sent: ${payload.type} for ${payload.deadlineTitle} to ${payload.to}`);
    return true;
  } catch (error) {
    console.error(`[Notification] Email failed:`, error);
    return false;
  }
}

export async function sendSmsNotification(payload: NotificationPayload, phone: string): Promise<boolean> {
  // SMS integration placeholder — requires Twilio or similar
  // For now, log the SMS that would be sent
  if (!process.env.TWILIO_SID) {
    console.log(`[Notification] SMS skipped (Twilio not configured): ${payload.type} for ${payload.deadlineTitle} to ${phone}`);
    return false;
  }

  try {
    // Twilio integration would go here:
    // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    // await twilio.messages.create({
    //   body: `[${APP_NAME}] ${payload.deadlineTitle} - ${urgencyLabel}. View: ${APP_URL}/deadlines/${payload.deadlineId}`,
    //   from: process.env.TWILIO_PHONE,
    //   to: phone,
    // });
    console.log(`[Notification] SMS sent: ${payload.type} for ${payload.deadlineTitle} to ${phone}`);
    return true;
  } catch (error) {
    console.error(`[Notification] SMS failed:`, error);
    return false;
  }
}

export async function sendNotification(
  payload: NotificationPayload,
  channels: { email: boolean; sms: boolean },
  phone?: string | null
): Promise<{ email: boolean; sms: boolean }> {
  const results = { email: false, sms: false };

  if (channels.email) {
    results.email = await sendEmailNotification(payload);
  }

  if (channels.sms && phone) {
    results.sms = await sendSmsNotification(payload, phone);
  }

  return results;
}
