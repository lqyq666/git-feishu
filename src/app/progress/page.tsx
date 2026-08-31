import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  if (!isSupabaseConfigured()) {
    return <main className="shell narrow-shell"><p className="eyebrow">进度尚未连接</p><h1>先完成数据服务配置。</h1><p className="lede">应用会在配置 Supabase 后保存并恢复你的 Day 1 / Day 2 状态。</p><Link className="text-link" href="/">回到 Day 1</Link></main>;
  }
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/");
  const { data: exploration } = await supabase.from("explorations").select("state,current_day,day_one_completed_at").eq("user_id", userData.user.id).maybeSingle();
  const state = exploration?.state ?? "UNKNOWN";
  const dayTwoAvailable = state === "DAY_2_READY" || state === "DAY_2_ACTIVE";
  return (
    <main className="shell narrow-shell">
      <p className="eyebrow">我的进度</p>
      <h1>{dayTwoAvailable ? "Day 1 已完成，下一步是把一个信号交给现实检验。" : "你的探索还停在 Day 1。"}</h1>
      <div className="progress-card"><span>当前状态</span><strong>{state === "DAY_2_ACTIVE" ? "Day 2 进行中" : state === "DAY_2_READY" ? "Day 2 已就绪" : "Day 1 欲望地图"}</strong></div>
      {dayTwoAvailable ? <Link className="primary-link" href="/day-2">继续 Day 2</Link> : <Link className="primary-link" href="/">继续填写 Day 1</Link>}
      <p className="continuity-note">当前设备无需登录，进度会自动保存。</p>
      <Link className="text-link optional-link" href="/login">可选：用邮箱备份到其他设备</Link>
    </main>
  );
}
