import Link from "next/link";
import { redirect } from "next/navigation";
import { ExplorationReport } from "@/components/exploration-report";
import { getExplorationTask } from "@/lib/exploration/tasks";
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
  const { data: exploration } = await supabase.from("explorations").select("id,state,current_day,day_one_completed_at").eq("user_id", userData.user.id).maybeSingle();
  const state = exploration?.state ?? "UNKNOWN";
  const currentDay = exploration?.current_day ?? 1;
  const complete = state === "ROUND_COMPLETE";
  if (complete && exploration) {
    const { data: evidence } = await supabase
      .from("evidence")
      .select("kind,position,content")
      .eq("exploration_id", exploration.id)
      .eq("status", "SUBMITTED")
      .order("created_at");
    return (
      <main className="shell narrow-shell report-page">
        <p className="day-marker">本轮探索已完成</p>
        <h1>你没有得到一个职业答案，但已经知道下一步该验证什么。</h1>
        <p className="lede">以下结论只来自你提交的行动、样本和真人反馈。它们是当前判断，不是永久标签。</p>
        <ExplorationReport evidence={evidence ?? []} />
        <Link className="text-link optional-link" href="/login">可选：用邮箱备份这份进度</Link>
      </main>
    );
  }
  const task = getExplorationTask(currentDay);
  const inDayOne = currentDay === 1 || !task;
  return (
    <main className="shell narrow-shell">
      <p className="day-marker">我的现实探索 · Day {currentDay} / 7</p>
      <h1>{inDayOne ? "先完成三条欲望信号。" : task.title}</h1>
      <div className="progress-track" aria-label={`已进行到第 ${currentDay} 天`}><span style={{ width: `${(currentDay / 7) * 100}%` }} /></div>
      <div className="progress-card"><span>今天的唯一任务</span><strong>{inDayOne ? "找到三个真实羡慕的样本" : task.objective}</strong></div>
      {inDayOne ? <Link className="primary-link" href="/">继续填写 Day 1</Link> : <Link className="primary-link" href={`/day-${currentDay}`}>继续 Day {currentDay}</Link>}
      <p className="continuity-note">当前设备无需登录，进度会自动保存。</p>
      <Link className="text-link optional-link" href="/login">可选：用邮箱备份到其他设备</Link>
    </main>
  );
}
