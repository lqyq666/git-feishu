import Link from "next/link";
import { redirect } from "next/navigation";
import { CommitmentCheckin } from "@/components/commitment-checkin";
import { ExplorationReport } from "@/components/exploration-report";
import { ShareActions } from "@/components/share-actions";
import { getExplorationTask } from "@/lib/exploration/tasks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export default async function ProgressPage() {
  if (!isSupabaseConfigured()) return <main className="shell narrow-shell"><p className="eyebrow">进度尚未连接</p><h1>先完成数据服务配置。</h1><Link className="text-link" href="/">返回首页</Link></main>;
  const supabase = await createSupabaseServerClient(); const user = (await supabase.auth.getUser()).data.user; if (!user) redirect("/");
  const exploration = (await supabase.from("explorations").select("id,state,current_day,current_stage,status,started_at,completed_at").eq("user_id", user.id).maybeSingle()).data; if (!exploration) redirect("/");
  const [tasksResult, signalsResult, evidenceResult, commitmentsResult, entitlementResult] = await Promise.all([
    supabase.from("exploration_tasks").select("task_number,status,submitted_data,completed_at").eq("exploration_id", exploration.id).order("task_number"),
    supabase.from("desire_signals").select("position,signal_type,source_label,attraction,willing_cost").eq("exploration_id", exploration.id).eq("status", "SUBMITTED").order("position"),
    supabase.from("evidence_items").select("evidence_type,content,external_url,created_at").eq("exploration_id", exploration.id).order("created_at"),
    supabase.from("commitments").select("id,status,action_statement,due_at,grace_minutes,recovery_action,created_at").eq("exploration_id", exploration.id).in("status", ["ACTIVE","LOCKED","EVIDENCE_SUBMITTED"]).order("created_at", { ascending: false }).limit(1),
    supabase.rpc("has_full_exploration_entitlement", { target_user: user.id }),
  ]);
  const tasks = tasksResult.data ?? []; const signals = signalsResult.data ?? []; const evidence = evidenceResult.data ?? []; const currentStage = exploration.current_stage ?? exploration.current_day; const complete = exploration.status === "COMPLETED" || exploration.state === "ROUND_COMPLETE";
  if (complete) return <main className="shell narrow-shell report-page"><p className="day-marker">本轮现实探索已完成</p><h1>你没有得到一个永久答案，但已经知道下一步该验证什么。</h1><p className="lede">以下判断只来自你的现实样本、行动产物、真人接触和反馈。</p><ExplorationReport evidence={evidence} signals={signals} tasks={tasks} /><ShareActions type="FINAL_REPORT" /><Link className="text-link optional-link" href="/login">可选：用邮箱备份进度</Link></main>;
  if (currentStage === 1) redirect("/"); if (currentStage > 1 && entitlementResult.data !== true) redirect("/desire-map");
  const task = getExplorationTask(currentStage); if (!task) redirect("/"); const commitment = commitmentsResult.data?.[0]; const overdue = commitment ? (await supabase.rpc("is_commitment_overdue", { target_commitment: commitment.id })).data === true : false;
  const evidenceCounts = evidence.reduce<Record<string, number>>((all, item) => ({ ...all, [item.evidence_type]: (all[item.evidence_type] ?? 0) + 1 }), {});
  return <main className="shell narrow-shell progress-page"><p className="day-marker">我的现实探索 · 任务 {currentStage} / 7</p><h1>{task.title}</h1><div className="progress-track" aria-label={`已进行到任务 ${currentStage}`}><span style={{ width: `${(currentStage / 7) * 100}%` }} /></div><section className="evidence-dashboard"><div><strong>{tasks.filter((item) => item.status === "COMPLETED").length}</strong><span>个已完成任务</span></div><div><strong>{evidence.length}</strong><span>条现实证据</span></div><div><strong>{Object.keys(evidenceCounts).length}</strong><span>种证据类型</span></div></section>{evidence.length ? <section className="recent-findings"><h2>最近获得的现实证据</h2><ul>{evidence.slice(-3).reverse().map((item, index) => <li key={`${item.created_at}-${index}`}><strong>{item.evidence_type}</strong><span>{item.content}</span></li>)}</ul></section> : <p className="continuity-note">接下来每次完成都要留下现实证据，而不只是打卡。</p>}{commitment ? <CommitmentCheckin action={commitment.action_statement} dueAt={commitment.due_at} id={commitment.id} overdue={overdue} recoveryAction={commitment.recovery_action} /> : null}<section className="next-action"><span>现在唯一要做的事</span><h2>{task.objective}</h2><Link className="primary-link" href={`/day-${currentStage}`}>继续任务 {currentStage}</Link></section><Link className="text-link optional-link" href="/login">可选：用邮箱备份到其他设备</Link></main>;
}
