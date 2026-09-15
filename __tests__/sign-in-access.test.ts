import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    workspaceInvitation: {
      findFirst: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/client", () => ({
  prisma: mockPrisma,
}));

import { isInvitedToWorkspace } from "../lib/workspace";

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.workspaceInvitation.findFirst.mockResolvedValue(null);
  mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);
});

describe("invited sign-in access", () => {
  it("lets through an address with a live invitation", async () => {
    mockPrisma.workspaceInvitation.findFirst.mockResolvedValue({ id: "inv_1" });

    await expect(isInvitedToWorkspace(" Teammate@Example.com ")).resolves.toBe(
      true
    );
    expect(mockPrisma.workspaceInvitation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: "teammate@example.com",
          status: "PENDING",
        }),
      })
    );
  });

  it("keeps letting a teammate in after the invitation was accepted", async () => {
    mockPrisma.workspaceMember.findFirst.mockResolvedValue({ id: "member_1" });

    await expect(isInvitedToWorkspace("teammate@example.com")).resolves.toBe(
      true
    );
    expect(mockPrisma.workspaceMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: { in: ["ADMIN", "MEMBER"] },
          user: { email: "teammate@example.com" },
        },
      })
    );
  });

  it("refuses an address nobody invited", async () => {
    await expect(isInvitedToWorkspace("stranger@example.com")).resolves.toBe(
      false
    );
  });

  it("refuses a missing address without querying", async () => {
    await expect(isInvitedToWorkspace(null)).resolves.toBe(false);
    expect(mockPrisma.workspaceInvitation.findFirst).not.toHaveBeenCalled();
  });
});
