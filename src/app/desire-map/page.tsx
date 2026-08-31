import Link from "next/link";
import { redirect } from "next/navigation";
import { PaywallActions } from "@/components/paywall-actions";
import { ShareActions } from "@/components/share-actions";
import { ProductEvent } from "@/components/product-event";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function DesireMapPage() {
  const supabase = await createSupabaseServerClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) redirect("/");
  const exploration = (
    await supabase
      .from("explorations")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
  ).data;
  if (!exploration) redirect("/");
  const signals =
    (
      await supabase
        .from("desire_signals")
        .select(
          "position,signal_type,source_label,attraction,willing_cost,quick_chips",
        )
        .eq("exploration_id", exploration.id)
        .eq("status", "SUBMITTED")
        .order("position")
    ).data ?? [];
  if (signals.length !== 3) redirect("/");
  const full =
    (
      await supabase.rpc("has_full_exploration_entitlement", {
        target_user: user.id,
      })
    ).data === true;
  const labels: Record<string, string> = {
    ENVY: "我羡慕的现实",
    CURIOSITY: "我反复靠近的好奇",
    DISSATISFACTION: "我不愿继续的现状",
    LEGACY: "我保留的现实信号",
  };
  return (
    <main className="shell narrow-shell desire-map-page">
      <ProductEvent name="desire_map_viewed" />
      {!full ? <ProductEvent name="paywall_viewed" /> : null}
      <p className="day-marker">任务 1 已完成 · 第一个价值时刻</p>
      <h1>我的欲望地图</h1>
      <p className="lede">
        这不是职业答案。它把三种模糊感受变成下一步可以调查、接触和实验的现实信号。
      </p>
      <div className="desire-map">
        {signals.map((signal) => (
          <article key={signal.position}>
            <span>{labels[signal.signal_type]}</span>
            <h2>{signal.source_label}</h2>
            <p>{signal.attraction}</p>
            <small>愿意承担：{signal.willing_cost}</small>
            {(signal.quick_chips as string[]).length ? (
              <div className="chip-summary">
                {(signal.quick_chips as string[]).map((chip) => (
                  <em key={chip}>{chip}</em>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {full ? (
        <section className="unlocked-panel">
          <p>完整探索已解锁</p>
          <h2>下一步：从三条信号中只选一条，调查它真实的一天。</h2>
          <Link className="primary-link" href="/day-2">
            进入任务 2
          </Link>
        </section>
      ) : (
        <section className="paywall" aria-labelledby="paywall-title">
          <p className="eyebrow">免费部分到这里</p>
          <h2 id="paywall-title">继续用 6 次现实行动，把信号变成判断。</h2>
          <ul>
            <li>两次不同方向的微型工作实验</li>
            <li>真人接触与真实反馈证据</li>
            <li>可恢复的行动承诺，而不是羞辱式惩罚</li>
            <li>完整现实证据报告与 14 天实验计划</li>
            <li>高级分享卡片（永远由你主动分享）</li>
          </ul>
          <PaywallActions />
        </section>
      )}
      <ShareActions type="DESIRE_MAP" />
    </main>
  );
}
