import Link from "next/link";
import { AccountRecoveryForm } from "@/components/account-recovery-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="shell narrow-shell">
      <p className="eyebrow">进度已自动保存</p>
      <h1>不用登录，直接继续。</h1>
      <p className="lede">你的探索进度已经自动保存在当前浏览器。只有准备换设备，或担心浏览器数据被清除时，才需要邮箱备份。</p>
      <Link className="primary-link" href="/progress">继续我的探索</Link>
      <section className="optional-backup" aria-labelledby="backup-title">
        <h2 id="backup-title">需要换设备继续？</h2>
        <p>输入邮箱后，我们会发送 6 位验证码。在当前页面填入即可，不用设置密码，也不用点击邮件链接。</p>
        <AccountRecoveryForm />
      </section>
    </main>
  );
}
