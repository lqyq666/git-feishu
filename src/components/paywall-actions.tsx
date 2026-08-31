"use client";
import { useState } from "react";

export function PaywallActions() {
  const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function checkout() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/payments/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productKey: "exploration_full_v1" }) });
      const body = await response.json() as { checkoutUrl?: string; message?: string; code?: string };
      if (!response.ok || !body.checkoutUrl) throw new Error(body.message ?? body.code ?? "暂时无法开始支付。");
      window.location.assign(body.checkoutUrl);
    } catch (error) { setMessage(error instanceof Error ? error.message : "暂时无法开始支付。"); setLoading(false); }
  }
  return <div className="paywall-actions"><button className="primary-button" disabled={loading} onClick={checkout} type="button">{loading ? "正在连接支付…" : "解锁完整探索"}</button><a className="text-link" href="/login">先用邮箱备份进度</a>{message ? <p className="form-message" role="alert">{message}</p> : null}</div>;
}
