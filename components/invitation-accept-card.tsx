"use client";

import { useState } from "react";

interface InvitationAcceptCardProps {
  token: string;
  isSignedIn: boolean;
  invitedEmail: string;
  sendSignInLink: () => Promise<void>;
}

export default function InvitationAcceptCard({
  token,
  isSignedIn,
  invitedEmail,
  sendSignInLink,
}: InvitationAcceptCardProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function acceptInvite() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/workspace/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const payload = await response.json();
    if (payload.success) {
      window.location.assign("/dashboard");
      return;
    }
    setMessage(payload.error ?? "Could not accept invitation");
    setBusy(false);
  }

  if (!isSignedIn) {
    return (
      <form action={sendSignInLink} className="space-y-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Email me a sign-in link
        </button>
        <p className="text-xs text-muted">
          We will send it to {invitedEmail}.
        </p>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={acceptInvite}
        disabled={busy}
        className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
      >
        {busy ? "Accepting..." : "Accept invitation"}
      </button>
      {message && <p className="text-sm text-error">{message}</p>}
      <p className="text-xs text-muted">
        Use the magic link account for {invitedEmail}.
      </p>
    </div>
  );
}

