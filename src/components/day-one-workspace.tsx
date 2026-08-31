"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DAY_ONE_SIGNAL_COUNT,
  type DesireSignal,
  validateDayOne,
} from "@/lib/exploration/domain";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const emptySignal = (): DesireSignal => ({
  admiredPerson: "",
  admiredQuality: "",
  acceptedCost: "",
});

export function DayOneWorkspace() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [signals, setSignals] = useState<DesireSignal[]>(() =>
    Array.from({ length: DAY_ONE_SIGNAL_COUNT }, emptySignal),
  );
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">(() => configured ? "loading" : "error");
  const [message, setMessage] = useState(() => configured ? "" : "应用代码已就绪，但还没有连接 Supabase 项目。请先完成 .env.local 与数据库迁移配置。");
  const [explorationId, setExplorationId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedSnapshot = useRef(JSON.stringify(signals));

  useEffect(() => {
    if (!configured) return;

    async function restoreOrCreateSession() {
      const supabase = createSupabaseBrowserClient();
      const { data: currentUser, error: currentUserError } = await supabase.auth.getUser();
      if (currentUserError && currentUserError.name !== "AuthSessionMissingError") {
        throw currentUserError;
      }
      const { data: authData, error: authError } = currentUser.user
        ? { data: { user: currentUser.user }, error: null }
        : await supabase.auth.signInAnonymously();
      if (authError || !authData.user) throw authError ?? new Error("无法创建匿名会话。");

      const user = authData.user;
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        is_anonymous: user.is_anonymous,
        updated_at: new Date().toISOString(),
      });
      if (profileError) throw profileError;

      const explorationResult = await supabase
        .from("explorations")
        .select("id,state,current_day")
        .eq("user_id", user.id)
        .maybeSingle();
      if (explorationResult.error) throw explorationResult.error;
      let exploration = explorationResult.data;
      if (!exploration) {
        const { data: createdExploration, error: createExplorationError } = await supabase
          .from("explorations")
          .insert({ user_id: user.id, state: "EXPLORING_DESIRE", current_day: 1 })
          .select("id,state,current_day")
          .single();
        if (createExplorationError) throw createExplorationError;
        exploration = createdExploration;
      }
      if (exploration.current_day > 1 || exploration.state === "ROUND_COMPLETE") {
        router.replace("/progress");
        return;
      }

      const { data: savedSignals, error: signalsError } = await supabase
        .from("evidence")
        .select("position,content")
        .eq("exploration_id", exploration.id)
        .eq("kind", "DAY_1_DESIRE_SIGNAL")
        .order("position");
      if (signalsError) throw signalsError;
      if (savedSignals?.length) {
        const restoredSignals = Array.from({ length: DAY_ONE_SIGNAL_COUNT }, (_, index) => {
          const item = savedSignals.find((signal: { position: number; content: unknown }) => signal.position === index + 1);
          return (item?.content as DesireSignal | undefined) ?? emptySignal();
        });
        savedSnapshot.current = JSON.stringify(restoredSignals);
        setSignals(restoredSignals);
      }
      setExplorationId(exploration.id);
      setStatus("ready");
    }

    restoreOrCreateSession().catch((error: Error) => {
      setStatus("error");
      setMessage(error.message || "无法建立你的探索会话。");
    });
  }, [configured, router]);

  useEffect(() => {
    if (status !== "ready" || !explorationId) return;
    const snapshot = JSON.stringify(signals);
    if (snapshot === savedSnapshot.current) return;
    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("evidence").upsert(
        signals.map((signal, index) => ({
          exploration_id: explorationId,
          kind: "DAY_1_DESIRE_SIGNAL",
          position: index + 1,
          content: signal,
          source: "USER_REPORTED",
          confidence: 3,
          status: "DRAFT",
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "exploration_id,kind,position" },
      );
      if (error) {
        setSaveStatus("error");
        return;
      }
      savedSnapshot.current = snapshot;
      setSaveStatus("saved");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [explorationId, signals, status]);

  function updateSignal(index: number, key: keyof DesireSignal, value: string) {
    setSignals((current) => current.map((signal, currentIndex) =>
      currentIndex === index ? { ...signal, [key]: value } : signal,
    ));
  }

  async function completeDayOne() {
    const validation = validateDayOne(signals);
    if (!validation.complete) {
      setMessage(validation.message);
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("会话已失效，请刷新后重试。");
      if (!explorationId) throw new Error("探索记录尚未准备好，请稍后重试。");
      const { error: evidenceError } = await supabase.from("evidence").upsert(
        validation.signals.map((signal, index) => ({
          exploration_id: explorationId,
          kind: "DAY_1_DESIRE_SIGNAL",
          position: index + 1,
          content: signal,
          source: "USER_REPORTED",
          confidence: 3,
          status: "SUBMITTED",
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "exploration_id,kind,position" },
      );
      if (evidenceError) throw evidenceError;
      const { error: explorationError } = await supabase
        .from("explorations")
        .update({
          state: "DAY_2_READY",
          current_day: 2,
          day_one_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", explorationId)
        .eq("user_id", userData.user.id);
      if (explorationError) throw explorationError;
      router.push("/progress");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    }
  }

  const disabled = status === "loading" || status === "saving" || status === "error";
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">大学生现实探索系统 · Day 1</p>
        <h1>先找真实的欲望信号，不急着给自己定方向。</h1>
        <p className="lede">写下三个人或现实样本：你羡慕什么，以及愿意为它承担什么代价。三条完整信号才会解锁 Day 2。</p>
      </section>
      <section className="notice" aria-live="polite">
        <strong>无需注册，进度会自动保存</strong>
        <span>{saveStatus === "saving" ? "正在保存草稿…" : saveStatus === "saved" ? "草稿已保存，刷新后仍可恢复。" : saveStatus === "error" ? "草稿暂时未保存，请保持页面开启并重试。" : "直接开始即可。只有需要换设备继续时，才选择用邮箱备份。"}</span>
      </section>
      <section className="workspace" aria-busy={status === "loading" || status === "saving"}>
        {signals.map((signal, index) => (
          <fieldset className="signal-card" key={index} disabled={disabled}>
            <legend>欲望信号 {index + 1}</legend>
            <label>我羡慕的真实人或样本
              <input value={signal.admiredPerson} onChange={(event) => updateSignal(index, "admiredPerson", event.target.value)} placeholder="例如：做过校园项目的学长" />
            </label>
            <label>我具体羡慕的是什么
              <input value={signal.admiredQuality} onChange={(event) => updateSignal(index, "admiredQuality", event.target.value)} placeholder="例如：能把问题做成可展示的成果" />
            </label>
            <label>我愿意先承担的代价
              <input value={signal.acceptedCost} onChange={(event) => updateSignal(index, "acceptedCost", event.target.value)} placeholder="例如：连续两周晚间整理作品" />
            </label>
          </fieldset>
        ))}
        {message ? <p className="form-message" role="alert">{message}</p> : null}
        <button className="primary-button" disabled={disabled} onClick={completeDayOne} type="button">
          {status === "saving" ? "正在保存…" : "完成 Day 1，进入 Day 2"}
        </button>
      </section>
    </main>
  );
}
