import Link from "next/link";
import { redirect } from "next/navigation";
import { DayTwoWorkspace } from "@/components/day-two-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DayTwoPage() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/");
  const { data: exploration } = await supabase.from("explorations").select("id,state").eq("user_id", userData.user.id).maybeSingle();
  if (!exploration || (exploration.state !== "DAY_2_READY" && exploration.state !== "DAY_2_ACTIVE")) redirect("/");
  const { data: evidence } = await supabase.from("evidence").select("position,content").eq("exploration_id", exploration.id).eq("kind", "DAY_1_DESIRE_SIGNAL").order("position");
  const signals = (evidence ?? []).map((item) => {
    const content = item.content as { admiredPerson?: string; admiredQuality?: string };
    return { position: item.position, admiredPerson: content.admiredPerson ?? "未命名样本", admiredQuality: content.admiredQuality ?? "未命名信号" };
  });
  if (signals.length !== 3) redirect("/");
  const { data: activeHypothesis } = await supabase
    .from("direction_hypotheses")
    .select("question,smallest_action")
    .eq("exploration_id", exploration.id)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeHypothesis) {
    return (
      <main className="shell narrow-shell">
        <p className="eyebrow">Day 2 · 已续接</p>
        <h1>你的现实检验起点已经保存。</h1>
        <section className="signal-card saved-hypothesis">
          <strong>我要验证的问题</strong><p>{activeHypothesis.question}</p>
          <strong>下一步最小现实动作</strong><p>{activeHypothesis.smallest_action}</p>
        </section>
        <Link className="text-link" href="/progress">回到我的进度</Link>
      </main>
    );
  }

  return <main className="shell narrow-shell"><p className="eyebrow">Day 2 · 现实检验</p><h1>把一条欲望信号，变成一个会被现实回答的问题。</h1><DayTwoWorkspace explorationId={exploration.id} signals={signals} /><Link className="text-link" href="/progress">暂时回到我的进度</Link></main>;
}
