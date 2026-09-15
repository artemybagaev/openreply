import { createTransport } from "nodemailer";

export const emailFrom =
  process.env.EMAIL_FROM ?? "OpenReply <login@example.com>";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends a transactional email over the same transport the magic links use:
 * EMAIL_SERVER (SMTP) when set, Resend otherwise. Throws when the transport
 * refuses the message, so callers decide whether that is fatal.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const smtpServer = process.env.EMAIL_SERVER;
  if (smtpServer) {
    await createTransport(smtpServer).sendMail({ from: emailFrom, ...message });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: emailFrom, ...message }),
  });

  if (!response.ok) {
    throw new Error(
      `Resend rejected the email (${response.status}): ${await response.text()}`
    );
  }
}
