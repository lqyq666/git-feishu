import Link from "next/link";
import { AccountRecoveryForm } from "@/components/account-recovery-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="shell narrow-shell">
      <p className="eyebrow">保存并续接</p>
      <h1>给这段探索留一个找回入口。</h1>
      <p className="lede">邮箱只用于验证你是同一个人。验证完成后，Day 1 与 Day 2 的记录会继续归在当前账号下。</p>
      <AccountRecoveryForm />
      <Link className="text-link" href="/progress">先回到我的进度</Link>
    </main>
  );
}
