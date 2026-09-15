import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSendMail } = vi.hoisted(() => ({ mockSendMail: vi.fn() }));

vi.mock("nodemailer", () => ({
  createTransport: vi.fn(() => ({ sendMail: mockSendMail })),
}));

import { sendInvitationEmail } from "../lib/invitation-email";

const invite = {
  to: "teammate@example.com",
  workspaceName: "Acme <Agency>",
  role: "MEMBER" as const,
  inviteUrl: "https://app.example.com/invite/token123",
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("invitation email", () => {
  it("sends through Resend when no SMTP server is configured", async () => {
    vi.stubEnv("EMAIL_SERVER", "");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendInvitationEmail(invite);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer re_test" }),
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toBe("teammate@example.com");
    expect(body.text).toContain(invite.inviteUrl);
    expect(body.html).toContain("Acme &lt;Agency&gt;");
    expect(body.html).not.toContain("<Agency>");
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("throws when Resend refuses the message", async () => {
    vi.stubEnv("EMAIL_SERVER", "");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("domain not verified", { status: 403 }))
    );

    await expect(sendInvitationEmail(invite)).rejects.toThrow(
      "Resend rejected the email (403): domain not verified"
    );
  });

  it("uses the SMTP server when EMAIL_SERVER is set", async () => {
    vi.stubEnv("EMAIL_SERVER", "smtps://user:pass@mail.example.com:465");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendInvitationEmail(invite);

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "teammate@example.com" })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
