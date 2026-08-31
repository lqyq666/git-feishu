"use client";

import { type FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AccountRecoveryForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function bindOrSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!isSupabaseConfigured()) {
      setMessage("应用尚未连接 Supabase 项目，暂时不能绑定邮箱。");
      return;
    }
    setSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      const redirectTo = `${window.location.origin}/auth/callback?next=/progress`;

      if (data.user?.is_anonymous) {
        const { error: updateError } = await supabase.auth.updateUser(
          { email },
          { emailRedirectTo: redirectTo },
        );
        if (updateError) throw updateError;
        setMessage("验证邮件已发送。打开邮件中的链接后，此匿名进度会绑定到你的邮箱。");
      } else {
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
        });
        if (signInError) throw signInError;
        setMessage("登录链接已发送。打开邮件中的链接后，会回到你的 Day 2 进度。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "发送失败，请稍后重试。");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="recovery-form" onSubmit={bindOrSignIn}>
      <label>用于找回进度的邮箱
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
      </label>
      <button className="primary-button" disabled={sending} type="submit">{sending ? "正在发送…" : "绑定或登录"}</button>
      {message ? <p className="form-message" role="status">{message}</p> : null}
    </form>
  );
}
