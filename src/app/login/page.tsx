import Link from "next/link";
import { AccountRecoveryForm } from "@/components/account-recovery-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="shell narrow-shell">
      <p className="eyebrow">登录不是必需的</p>
      <h1>当前设备直接继续，不用注册。</h1>
      <p className="lede">你的探索进度已经自动保存在当前浏览器。只有准备换设备，或担心浏览器数据被清除时，才需要邮箱备份。</p>
      <Link className="primary-link" href="/progress">继续我的探索</Link>
      <section className="optional-backup" aria-labelledby="backup-title">
        <h2 id="backup-title">需要换设备继续？</h2>
        <p>可以选择留下邮箱。无需设置密码，我们只发送一次验证链接来确认进度属于你。</p>
        <AccountRecoveryForm />
      </section>
    </main>
  );
}
