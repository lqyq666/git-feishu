# Sources: Supabase email OTP

## Official documentation

- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates): `{{ .Token }}` renders a six-digit OTP and can replace `{{ .ConfirmationURL }}`. Verification uses `verifyOtp`.
- [Passwordless email logins](https://supabase.com/docs/guides/auth/auth-email-passwordless): email OTP shares the Magic Link implementation; the Magic Link template must contain `{{ .Token }}`. Requests are rate-limited and codes expire.
- [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous): an anonymous user can be converted in place with `updateUser({ email })`; the email can be verified by entering the six-digit OTP.
- [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp): verifies an email and supplied token.
- [signInWithOtp](https://supabase.com/docs/reference/javascript/auth-signinwithotp): sends OTP rather than a link when the email template contains `{{ .Token }}`.

## Installed SDK evidence

- `@supabase/auth-js` documents `email_change` as the verification type for an OTP sent during an email update.
- Installed `EmailOtpType` includes `email` and `email_change`.

## Project constraints

- The current anonymous user owns Day 1/Day 2 rows through `auth.uid()` RLS, so anonymous conversion must preserve the same Supabase user ID.
- Existing returning users must not be auto-created from arbitrary emails; `shouldCreateUser: false` remains required.
- Email is optional and only used for cross-device recovery.
