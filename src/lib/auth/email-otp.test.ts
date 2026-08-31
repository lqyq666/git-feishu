import { describe, expect, it } from "vitest";
import {
  isCompleteEmailOtp,
  normalizeEmailOtp,
  requestEmailOtp,
  selectEmailOtpFlow,
  verifyEmailOtpPreservingIdentity,
} from "./email-otp";

describe("email OTP flow", () => {
  it("uses email_change when preserving an anonymous user's progress", () => {
    expect(selectEmailOtpFlow(true)).toBe("email_change");
  });

  it("uses email when signing in an existing permanent user", () => {
    expect(selectEmailOtpFlow(false)).toBe("email");
  });

  it("keeps only a six-digit verification code", () => {
    expect(normalizeEmailOtp("12a 34-567")).toBe("123456");
    expect(isCompleteEmailOtp("123456")).toBe(true);
    expect(isCompleteEmailOtp("12345")).toBe(false);
  });

  it("upgrades an anonymous identity without creating or switching users", async () => {
    const calls: string[] = [];
    const anonymousUser = { id: "anonymous-user-1", is_anonymous: true };
    const auth = {
      getUser: async () => ({ data: { user: anonymousUser }, error: null }),
      updateUser: async ({ email }: { email: string }) => {
        calls.push(`update:${email}`);
        return { error: null };
      },
      signInWithOtp: async () => {
        calls.push("sign-in");
        return { error: null };
      },
      verifyOtp: async ({ type }: { type: string }) => {
        calls.push(`verify:${type}`);
        return { error: null };
      },
    };

    const request = await requestEmailOtp(auth, "student@example.com");
    const resultingId = await verifyEmailOtpPreservingIdentity(auth, {
      email: "student@example.com",
      token: "123456",
      ...request,
    });

    expect(resultingId).toBe(anonymousUser.id);
    expect(calls).toEqual([
      "update:student@example.com",
      "verify:email_change",
    ]);
  });

  it("rejects an anonymous email binding that changes the user id", async () => {
    let reads = 0;
    const auth = {
      getUser: async () => ({
        data: {
          user: {
            id: reads++ === 0 ? "anonymous-user-1" : "different-user",
            is_anonymous: true,
          },
        },
        error: null,
      }),
      updateUser: async () => ({ error: null }),
      signInWithOtp: async () => ({ error: null }),
      verifyOtp: async () => ({ error: null }),
    };

    const request = await requestEmailOtp(auth, "student@example.com");
    await expect(
      verifyEmailOtpPreservingIdentity(auth, {
        email: "student@example.com",
        token: "123456",
        ...request,
      }),
    ).rejects.toThrow("用户身份发生变化");
  });
});
