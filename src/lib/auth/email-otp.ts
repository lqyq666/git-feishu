export type EmailOtpFlow = "email" | "email_change";

export function selectEmailOtpFlow(isAnonymous: boolean): EmailOtpFlow {
  return isAnonymous ? "email_change" : "email";
}

export function normalizeEmailOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isCompleteEmailOtp(value: string): boolean {
  return /^\d{6}$/.test(value);
}
