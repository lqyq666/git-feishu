import { describe, expect, it } from "vitest";
import { canAccessTask, hasFullAccess } from "./domain";
describe("entitlements", () => {
  const now = new Date("2026-08-31T00:00:00Z");
  it("keeps Task 1 free", () => expect(canAccessTask(1, [], now)).toBe(true));
  it("allows active full/manual/payment access", () => expect(hasFullAccess([{ accessLevel: "FULL_EXPLORATION", startsAt: "2026-08-01T00:00:00Z" }], now)).toBe(true));
  it("rejects expired or revoked access", () => expect(hasFullAccess([{ accessLevel: "FULL_EXPLORATION", startsAt: "2026-08-01T00:00:00Z", expiresAt: "2026-08-30T00:00:00Z" }], now)).toBe(false));
});
