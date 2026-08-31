import Link from "next/link";
import { redirect } from "next/navigation";
import { DailyTaskWorkspace } from "@/components/daily-task-workspace";
import { getExplorationTask } from "@/lib/exploration/tasks";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EvidenceRow = { kind: string; position: number; content: unknown; status: string };

function contentOf(row: EvidenceRow | undefined) {
  return (row?.content && typeof row.content === "object" ? row.content : {}) as Record<string, string>;
}

function contextFor(day: number, evidence: EvidenceRow[]) {
  const byKind = (kind: string) => contentOf(evidence.find((row) => row.kind === kind && row.status === "SUBMITTED"));
  if (day === 2) {
    const items = evidence.filter((row) => row.kind === "DAY_1_DESIRE_SIGNAL" && row.status === "SUBMITTED").sort((a, b) => a.position - b.position).map((row) => {
      const value = contentOf(row);
      return `${value.admiredPerson}：${value.admiredQuality}`;
    });
    return { title: "从你的欲望信号继续", items };
  }
  const scan = byKind("DAY_2_REALITY_SCAN");
  const contact = byKind("DAY_3_HUMAN_CONTACT");
  const experimentA = byKind("DAY_4_EXPERIMENT_A");
  const feedback = byKind("DAY_5_REAL_FEEDBACK");
  const experimentB = byKind("DAY_6_EXPERIMENT_B");
  const contexts: Record<number, { title: string; items: string[] }> = {
    3: { title: "今天要让真人回答的问题", items: [scan.candidateDirection, scan.question].filter(Boolean) },
    4: { title: "真人建议你先做的实验", items: [contact.suggestedExperiment, contact.surprise].filter(Boolean) },
    5: { title: "今天要交给真人的结果", items: [experimentA.direction, experimentA.artifact].filter(Boolean) },
    6: { title: "实验 B 必须形成对照", items: [`实验 A：${experimentA.direction ?? "未记录"}`, feedback.unexpectedFeedback].filter(Boolean) },
    7: { title: "判断只能基于这两次行动", items: [`实验 A：${experimentA.direction ?? "未记录"}`, `实验 B：${experimentB.direction ?? "未记录"}`, experimentB.comparison].filter(Boolean) },
  };
  return contexts[day] ?? { title: "已有证据", items: [] };
}

export async function DailyTaskPage({ day }: { day: number }) {
  if (!isSupabaseConfigured()) redirect("/");
  const task = getExplorationTask(day);
  if (!task) redirect("/progress");
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/");
  const { data: exploration } = await supabase
    .from("explorations")
    .select("id,state,current_day")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!exploration) redirect("/");
  if (exploration.state === "ROUND_COMPLETE" || exploration.current_day !== day) redirect("/progress");

  const { data: allEvidence } = await supabase
    .from("evidence")
    .select("kind,position,content,status")
    .eq("exploration_id", exploration.id)
    .order("created_at");
  const evidence = (allEvidence ?? []) as EvidenceRow[];
  const savedEvidence = evidence.find((row) => row.kind === task.evidenceKind && row.position === 1);

  let initialContent = contentOf(savedEvidence);
  if (day === 2 && Object.keys(initialContent).length === 0) {
    const { data: legacyHypothesis } = await supabase
      .from("direction_hypotheses")
      .select("question,smallest_action")
      .eq("exploration_id", exploration.id)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (legacyHypothesis) {
      initialContent = { question: legacyHypothesis.question, smallestAction: legacyHypothesis.smallest_action };
    }
  }
  const taskContext = contextFor(day, evidence);
  const experimentADirection = contentOf(evidence.find((row) => row.kind === "DAY_4_EXPERIMENT_A" && row.status === "SUBMITTED")).direction;

  return (
    <main className="shell narrow-shell task-page">
      <p className="day-marker">Day {day} / 7</p>
      <h1>{task.title}</h1>
      {taskContext.items.length ? <section className="task-context"><strong>{taskContext.title}</strong><ul>{taskContext.items.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      <DailyTaskWorkspace explorationId={exploration.id} experimentADirection={experimentADirection} initialContent={initialContent} task={task} />
      <Link className="text-link" href="/progress">暂时离开，回到我的进度</Link>
    </main>
  );
}
