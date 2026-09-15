import { sendEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Emails a teammate the link to join a workspace. The link opens the
 * invitation page, which sends the magic link to the invited address.
 */
export async function sendInvitationEmail({
  to,
  workspaceName,
  role,
  inviteUrl,
}: {
  to: string;
  workspaceName: string;
  role: "ADMIN" | "MEMBER";
  inviteUrl: string;
}): Promise<void> {
  const roleLabel = role.toLowerCase();
  const safeName = escapeHtml(workspaceName);
  const safeUrl = escapeHtml(inviteUrl);

  await sendEmail({
    to,
    subject: `You're invited to ${workspaceName} on OpenReply`,
    text: [
      `You were invited to join ${workspaceName} on OpenReply as ${roleLabel}.`,
      "",
      `Accept the invitation: ${inviteUrl}`,
      "",
      "If you did not expect this, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>You were invited to join <strong>${safeName}</strong> on OpenReply as ${roleLabel}.</p>
      <p><a href="${safeUrl}">Accept the invitation</a></p>
      <p style="color:#71717a;font-size:12px">If you did not expect this, you can ignore this email.</p>
    `,
  });
}
