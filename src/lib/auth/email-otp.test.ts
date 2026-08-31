import { describe, expect, it } from "vitest";
import {
  isCompleteEmailOtp,
  normalizeEmailOtp,
  selectEmailOtpFlow,
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
});
