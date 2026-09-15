import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthError } from "next-auth";
import InvitationAcceptCard from "@/components/invitation-accept-card";
import { auth, EMAIL_PROVIDER_ID, signIn } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { normalizeInvitationEmail } from "@/lib/workspace-invitations";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: "Accept Workspace Invitation - OpenReply",
  robots: { index: false, follow: false },
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const [session, invitation] = await Promise.all([
    auth(),
    prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: { select: { name: true } },
      },
    }),
  ]);

  // A new account accepts its invitations while it is created, so the magic
  // link lands back here with the invitation already accepted.
  if (
    invitation?.status === "ACCEPTED" &&
    session?.user?.email &&
    normalizeInvitationEmail(session.user.email) === invitation.email
  ) {
    redirect("/dashboard");
  }

  if (!invitation || invitation.status !== "PENDING") {
    notFound();
  }

  const expired = invitation.expiresAt <= new Date();
  const invitedEmail = invitation.email;

  async function sendSignInLink() {
    "use server";
    let errorType: string;
    try {
      await signIn(EMAIL_PROVIDER_ID, {
        email: invitedEmail,
        redirectTo: `/invite/${token}`,
      });
      return;
    } catch (error) {
      if (!(error instanceof AuthError)) throw error;
      errorType = error.type;
    }
    redirect(`/login?error=${encodeURIComponent(errorType)}`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-12">
        <Link href="/" className="mb-8 text-sm font-bold text-cyan-100">
          OpenReply
        </Link>
        <section className="border border-white/10 bg-white/[0.035] p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">
            Workspace invitation
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight text-white">
            Join {invitation.workspace.name}
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            You were invited as {invitation.role.toLowerCase()} for{" "}
            {invitation.email}.
          </p>
          <div className="mt-8">
            {expired ? (
              <p className="text-sm text-error">
                This invitation has expired. Ask the workspace owner to resend it.
              </p>
            ) : (
              <InvitationAcceptCard
                token={token}
                isSignedIn={Boolean(session?.user?.id)}
                invitedEmail={invitedEmail}
                sendSignInLink={sendSignInLink}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

