"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Signal = { position: number; admiredPerson: string; admiredQuality: string };

export function DayTwoWorkspace({ explorationId, signals }: { explorationId: string; signals: Signal[] }) {
  const router = useRouter();
  const [selectedSignal, setSelectedSignal] = useState(String(signals[0]?.position ?? 1));
  const [question, setQuestion] = useState("");
  const [smallestAction, setSmallestAction] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveDayTwoStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim().length < 8 || smallestAction.trim().length < 8) {
      setMessage("请把验证问题和下一步现实动作各写清楚一点（至少 8 个字）。");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: hypothesisError } = await supabase.from("direction_hypotheses").insert({
        exploration_id: explorationId,
        source_evidence_position: Number(selectedSignal),
        question: question.trim(),
        smallest_action: smallestAction.trim(),
      });
      if (hypothesisError) throw hypothesisError;
      const { error: explorationError } = await supabase
        .from("explorations")
        .update({ state: "DAY_2_ACTIVE", current_day: 2, updated_at: new Date().toISOString() })
        .eq("id", explorationId);
      if (explorationError) throw explorationError;
      router.push("/progress");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="workspace" onSubmit={saveDayTwoStart}>
      <p className="lede">只选一条信号。你不是在做职业承诺，而是在提出一个可被现实检验的问题。</p>
      <fieldset className="signal-card"><legend>从哪条 Day 1 信号继续？</legend>
        {signals.map((signal) => (
          <label className="radio-row" key={signal.position}>
            <input checked={selectedSignal === String(signal.position)} name="signal" onChange={(event) => setSelectedSignal(event.target.value)} type="radio" value={signal.position} />
            <span>{signal.admiredPerson}：{signal.admiredQuality}</span>
          </label>
        ))}
      </fieldset>
      <label>我现在想验证的问题
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：我是否愿意持续做用户访谈，而不只是喜欢看产品案例？" required />
      </label>
      <label>下一步最小现实动作
        <textarea value={smallestAction} onChange={(event) => setSmallestAction(event.target.value)} placeholder="例如：本周约一位做过产品实习的学长，带着三个问题访谈 20 分钟。" required />
      </label>
      {message ? <p className="form-message" role="alert">{message}</p> : null}
      <button className="primary-button" disabled={saving} type="submit">{saving ? "正在保存…" : "保存 Day 2 起点"}</button>
    </form>
  );
}
