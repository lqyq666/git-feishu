"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isCompleteEmailOtp,
  normalizeEmailOtp,
  selectEmailOtpFlow,
  type EmailOtpFlow,
} from "@/lib/auth/email-otp";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { trackProductEvent } from "@/lib/analytics/client";

export function AccountRecoveryForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flow, setFlow] = useState<EmailOtpFlow | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "info">("info");
  const [status, setStatus] = useState<"idle" | "sending" | "verifying">(
    "idle",
  );

  async function requestCode() {
    void trackProductEvent("email_binding_started");
    setMessage("");
    if (!isSupabaseConfigured()) {
      setMessageTone("error");
      setMessage("应用尚未连接 Supabase 项目，暂时不能发送验证码。");
      return;
    }
    setStatus("sending");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getUser();
      if (error && error.name !== "AuthSessionMissingError") throw error;
      const nextFlow = selectEmailOtpFlow(Boolean(data.user?.is_anonymous));

      if (nextFlow === "email_change") {
        const { error: updateError } = await supabase.auth.updateUser({
          email,
        });
        if (updateError) throw updateError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (signInError) throw signInError;
      }
      setFlow(nextFlow);
      setOtp("");
      setMessageTone("info");
      setMessage(
        "6 位验证码已发送，请在当前页面输入。验证码一分钟后可重新发送。",
      );
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "发送失败，请稍后重试。",
      );
    } finally {
      setStatus("idle");
    }
  }

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!flow || !isCompleteEmailOtp(otp)) {
      setMessageTone("error");
      setMessage("请输入邮件中的 6 位数字验证码。");
      return;
    }
    setStatus("verifying");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: flow,
      });
      if (error) throw error;
      void trackProductEvent("email_binding_completed");
      router.replace("/progress");
      router.refresh();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "验证码无效或已过期，请重新获取。",
      );
    } finally {
      setStatus("idle");
    }
  }

  function changeEmail() {
    setFlow(null);
    setOtp("");
    setMessage("");
  }

  if (flow) {
    return (
      <form className="recovery-form" onSubmit={verifyCode}>
        <p className="otp-destination">
          验证码已发送至 <strong>{email}</strong>
        </p>
        <label>
          6 位验证码
          <input
            autoComplete="one-time-code"
            autoFocus
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setOtp(normalizeEmailOtp(event.target.value))}
            pattern="[0-9]{6}"
            placeholder="000000"
            value={otp}
          />
        </label>
        <button
          className="primary-button"
          disabled={status !== "idle" || !isCompleteEmailOtp(otp)}
          type="submit"
        >
          {status === "verifying" ? "正在验证…" : "验证并继续"}
        </button>
        <div className="otp-actions">
          <button
            disabled={status !== "idle"}
            onClick={requestCode}
            type="button"
          >
            重新发送
          </button>
          <button
            disabled={status !== "idle"}
            onClick={changeEmail}
            type="button"
          >
            更换邮箱
          </button>
        </div>
        {message ? (
          <p
            className="form-message"
            data-tone={messageTone}
            role={messageTone === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form className="recovery-form" onSubmit={sendCode}>
      <label>
        备份邮箱（可选）
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <button
        className="primary-button"
        disabled={status !== "idle"}
        type="submit"
      >
        {status === "sending" ? "正在发送…" : "发送验证码"}
      </button>
      {message ? (
        <p
          className="form-message"
          data-tone={messageTone}
          role={messageTone === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
