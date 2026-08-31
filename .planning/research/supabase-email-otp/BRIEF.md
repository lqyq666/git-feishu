# Brief: Supabase email verification code

**Date:** 2026-08-31  
**Status:** Implemented; production deployment pending  
**Research question:** How should the app replace email links with an in-page verification-code flow without losing an anonymous user's existing exploration data?

## Recommendation

Use Supabase's native email OTP. For an anonymous user, call `updateUser({ email })`, then verify the six-digit code with `verifyOtp({ email, token, type: "email_change" })` so the existing user ID and RLS-owned progress remain intact. For an existing permanent user, call `signInWithOtp({ email, options: { shouldCreateUser: false } })`, then verify with type `email`.

## Key findings

1. Supabase sends a six-digit OTP when the relevant email template contains `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.
2. Anonymous users can be converted in place with `updateUser({ email })`; this is safer than signing into a separate account because progress ownership is tied to `auth.uid()`.
3. `verifyOtp` supports both `email_change` and `email`, matching the two required flows.

## Approach

### What to use

- A two-step form: email submission, then six-digit code entry on the same page.
- `updateUser` + `email_change` OTP for anonymous conversion.
- `signInWithOtp` + `email` OTP for returning users.
- Supabase `Magic Link` and `Change Email Address` templates containing `{{ .Token }}` and no confirmation link.

### What NOT to use

- Do not keep `{{ .ConfirmationURL }}` in these templates; it would continue sending clickable links.
- Do not use `signInWithOtp` to convert a fresh anonymous user; that could switch account identity and orphan the current RLS-owned progress.
- Do not add passwords, CAPTCHA UI, or a new backend service in this change.

## Constraints

- The code is delivered by email, so testing the full delivery loop requires a real email address.
- Supabase rate-limits repeat OTP requests; the UI should not imply unlimited resend.
- The production email templates are external configuration and must be updated together with the frontend.
- Existing `/auth/callback` can remain for backward compatibility, but the new primary flow does not depend on it.

## Implementation checklist

- [x] Replace the one-step form with email → code states.
- [x] Preserve anonymous progress with `updateUser` and `email_change` verification.
- [x] Support existing-account OTP sign-in with `shouldCreateUser: false`.
- [x] Update Supabase Magic Link and Change Email Address templates to show `{{ .Token }}`.
- [x] Add unit coverage for flow selection and code validation.
- [x] Run tests, lint, and build.
- [ ] Deploy and visually verify both steps after SMTP and templates are ready.

## Remaining verification

- Custom SMTP is enabled and both production templates were saved and read back with `{{ .Token }}` and without `{{ .ConfirmationURL }}`.
- End-to-end email delivery remains unverified until a real mailbox is deliberately used for testing.
