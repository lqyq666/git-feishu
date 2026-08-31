export type EmailOtpFlow = "email" | "email_change";

type AuthResult = { error: Error | null };
type UserResult = {
  data: { user: { id: string; is_anonymous?: boolean } | null };
  error: Error | null;
};

export type EmailOtpAuthClient = {
  getUser(): Promise<UserResult>;
  updateUser(input: { email: string }): Promise<AuthResult>;
  signInWithOtp(input: {
    email: string;
    options: { shouldCreateUser: false };
  }): Promise<AuthResult>;
  verifyOtp(input: {
    email: string;
    token: string;
    type: EmailOtpFlow;
  }): Promise<AuthResult>;
};

export function selectEmailOtpFlow(isAnonymous: boolean): EmailOtpFlow {
  return isAnonymous ? "email_change" : "email";
}

export function normalizeEmailOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isCompleteEmailOtp(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export async function requestEmailOtp(
  auth: EmailOtpAuthClient,
  email: string,
): Promise<{ flow: EmailOtpFlow; originalUserId: string | null }> {
  const current = await auth.getUser();
  if (current.error && current.error.name !== "AuthSessionMissingError")
    throw current.error;

  const flow = selectEmailOtpFlow(Boolean(current.data.user?.is_anonymous));
  const result =
    flow === "email_change"
      ? await auth.updateUser({ email })
      : await auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
  if (result.error) throw result.error;
  return { flow, originalUserId: current.data.user?.id ?? null };
}

export async function verifyEmailOtpPreservingIdentity(
  auth: EmailOtpAuthClient,
  input: {
    email: string;
    token: string;
    flow: EmailOtpFlow;
    originalUserId: string | null;
  },
): Promise<string | null> {
  const verification = await auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: input.flow,
  });
  if (verification.error) throw verification.error;

  const current = await auth.getUser();
  if (current.error) throw current.error;
  const currentUserId = current.data.user?.id ?? null;
  if (
    input.flow === "email_change" &&
    input.originalUserId !== null &&
    currentUserId !== input.originalUserId
  ) {
    throw new Error("邮箱绑定后用户身份发生变化，已停止继续跳转。");
  }
  return currentUserId;
}
