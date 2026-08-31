"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DAY_ONE_SIGNAL_COUNT,
  SIGNAL_TYPES,
  normalizeSignal,
  resolveNewestDraft,
  signalFeedback,
  type DesireSignal,
  validateDayOne,
} from "@/lib/exploration/domain";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { trackProductEvent } from "@/lib/analytics/client";

type Draft = {
  signals: DesireSignal[];
  step: number;
  revision: number;
  updatedAt: string;
  submitted?: boolean;
};
type SignalRow = {
  position: number;
  signal_type: string;
  source_label: string;
  attraction: string;
  willing_cost: string;
  quick_chips: unknown;
  status: string;
  revision: number;
  updated_at: string;
};
const STORAGE_KEY = "exploration:vnext:task-1";
const LABELS = {
  ENVY: {
    eyebrow: "信号 1 · 羡慕",
    title: "最近，你具体羡慕过谁或哪种现实状态？",
    source: "这个真实人或场景是什么？",
    attraction: "真正吸引你的是什么？",
    hint: "不写“优秀”“成功”，写你想拥有的具体状态。",
  },
  CURIOSITY: {
    eyebrow: "信号 2 · 好奇",
    title: "哪件事你反复想靠近，却一直没有真正试过？",
    source: "这份好奇从哪里出现？",
    attraction: "你最想亲自确认什么？",
    hint: "写一个反复出现的问题、工作或生活方式。",
  },
  DISSATISFACTION: {
    eyebrow: "信号 3 · 不满",
    title: "你最不想让哪种现状继续下去？",
    source: "让你不满的现实是什么？",
    attraction: "如果它改变了，你最想得到什么？",
    hint: "不必正能量。不满也能指出行动方向。",
  },
} as const;
const CHIPS = [
  "更自主",
  "能创造",
  "被需要",
  "看见成果",
  "持续成长",
  "和真实的人合作",
];
const blankSignals = () =>
  SIGNAL_TYPES.map((type) => ({
    type,
    source: "",
    attraction: "",
    willingCost: "",
    quickChips: [],
  })) as DesireSignal[];

function readLocal(): Draft | null {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Draft | null;
    return parsed?.signals?.length === 3
      ? { ...parsed, signals: parsed.signals.map(normalizeSignal) }
      : null;
  } catch {
    return null;
  }
}

export function DayOneWorkspace() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [started, setStarted] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => ({
    signals: blankSignals(),
    step: 0,
    revision: 1,
    updatedAt: new Date(0).toISOString(),
  }));
  const [explorationId, setExplorationId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "saving" | "error"
  >(configured ? "loading" : "error");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "offline" | "error"
  >("idle");
  const [message, setMessage] = useState(
    configured ? "" : "数据服务尚未配置，暂时无法建立探索会话。",
  );
  const latestRef = useRef(draft);
  const savedRevision = useRef(0);

  const persist = useCallback(
    async (value: Draft) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      if (
        !explorationId ||
        value.submitted ||
        value.revision <= savedRevision.current
      )
        return;
      if (!navigator.onLine) {
        setSaveState("offline");
        return;
      }
      setSaveState("saving");
      const supabase = createSupabaseBrowserClient();
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setSaveState("error");
        return;
      }
      const { error } = await supabase.from("desire_signals").upsert(
        value.signals.map((signal, index) => ({
          exploration_id: explorationId,
          user_id: user.id,
          position: index + 1,
          signal_type: signal.type,
          source_label: signal.source,
          attraction: signal.attraction,
          willing_cost: signal.willingCost,
          quick_chips: signal.quickChips,
          status: "DRAFT",
          revision: value.revision,
          updated_at: value.updatedAt,
        })),
        { onConflict: "exploration_id,position" },
      );
      if (error) {
        setSaveState("error");
        return;
      }
      savedRevision.current = value.revision;
      setSaveState("saved");
    },
    [explorationId],
  );

  useEffect(() => {
    latestRef.current = draft;
  }, [draft]);
  useEffect(() => {
    if (status !== "ready") return;
    void trackProductEvent(
      started ? "signal_started" : "landing_view",
      started ? { position: draft.step + 1 } : {},
    );
  }, [draft.step, started, status]);
  useEffect(() => {
    if (!configured) return;
    async function initialize() {
      const local = readLocal();
      const supabase = createSupabaseBrowserClient();
      const current = await supabase.auth.getUser();
      const auth = current.data.user
        ? { data: { user: current.data.user }, error: null }
        : await supabase.auth.signInAnonymously();
      if (auth.error || !auth.data.user)
        throw auth.error ?? new Error("无法创建匿名会话。");
      await supabase.from("profiles").upsert({
        id: auth.data.user.id,
        is_anonymous: auth.data.user.is_anonymous,
        updated_at: new Date().toISOString(),
      });
      const found = await supabase
        .from("explorations")
        .select("id,current_stage,current_day,status")
        .eq("user_id", auth.data.user.id)
        .maybeSingle();
      if (found.error) throw found.error;
      let exploration = found.data;
      if (!exploration) {
        const created = await supabase
          .from("explorations")
          .insert({
            user_id: auth.data.user.id,
            state: "EXPLORING_DESIRE",
            current_day: 1,
            current_stage: 1,
            status: "ACTIVE",
          })
          .select("id,current_stage,current_day,status")
          .single();
        if (created.error) throw created.error;
        exploration = created.data;
      }
      if (
        (exploration.current_stage ?? exploration.current_day) > 1 ||
        exploration.status === "COMPLETED"
      ) {
        router.replace("/progress");
        return;
      }
      const rows = await supabase
        .from("desire_signals")
        .select(
          "position,signal_type,source_label,attraction,willing_cost,quick_chips,status,revision,updated_at",
        )
        .eq("exploration_id", exploration.id)
        .order("position");
      if (rows.error) throw rows.error;
      const signalRows = (rows.data ?? []) as SignalRow[];
      const submitted = signalRows.some((row) => row.status === "SUBMITTED");
      const server: Draft | null = signalRows.length
        ? {
            signals: Array.from(
              { length: DAY_ONE_SIGNAL_COUNT },
              (_, index) => {
                const row = signalRows.find(
                  (item) => item.position === index + 1,
                );
                return row
                  ? normalizeSignal(
                      {
                        type: row.signal_type as DesireSignal["type"],
                        source: row.source_label,
                        attraction: row.attraction,
                        willingCost: row.willing_cost,
                        quickChips: row.quick_chips as string[],
                      },
                      index,
                    )
                  : blankSignals()[index];
              },
            ),
            step: Math.min(
              signalRows.filter(
                (row) => row.source_label && row.attraction && row.willing_cost,
              ).length,
              2,
            ),
            revision: Math.max(...signalRows.map((row) => row.revision)),
            updatedAt: signalRows
              .map((row) => row.updated_at)
              .sort()
              .at(-1)!,
            submitted,
          }
        : null;
      const newest = resolveNewestDraft(local, server) ?? draft;
      savedRevision.current = server?.revision ?? 0;
      setDraft(newest);
      latestRef.current = newest;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newest));
      setStarted(Boolean(local || server));
      setExplorationId(exploration.id);
      setStatus("ready");
    }
    initialize().catch((error: Error) => {
      setStatus("error");
      setMessage(error.message || "无法恢复探索进度。");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, router]);

  useEffect(() => {
    if (status !== "ready" || !started || draft.submitted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    const timer = window.setTimeout(() => void persist(draft), 1000);
    return () => window.clearTimeout(timer);
  }, [draft, persist, started, status]);
  useEffect(() => {
    const flush = () => void persist(latestRef.current);
    const visibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [persist]);

  function update(field: keyof DesireSignal, value: string | string[]) {
    setMessage("");
    setDraft((current) => ({
      ...current,
      signals: current.signals.map((signal, index) =>
        index === current.step ? { ...signal, [field]: value } : signal,
      ),
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
    }));
  }
  function next() {
    const signal = draft.signals[draft.step];
    if (
      signal.source.trim().length < 2 ||
      signal.attraction.trim().length < 2 ||
      signal.willingCost.trim().length < 2
    ) {
      setMessage("把这三个问题写具体后再继续。");
      return;
    }
    void trackProductEvent("signal_completed", {
      position: draft.step + 1,
      type: signal.type,
    });
    if (draft.step < 2)
      setDraft((current) => ({
        ...current,
        step: current.step + 1,
        revision: current.revision + 1,
        updatedAt: new Date().toISOString(),
      }));
    else void submit();
  }
  async function submit() {
    const validation = validateDayOne(draft.signals);
    if (!validation.complete || !explorationId) {
      setMessage(
        validation.complete ? "探索会话尚未准备好。" : validation.message,
      );
      return;
    }
    setStatus("saving");
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const payload = validation.signals.map((signal, index) => ({
      ...signal,
      position: index + 1,
      revision: draft.revision,
    }));
    const result = await supabase.rpc("submit_desire_map", {
      target_exploration: explorationId,
      signals: payload,
    });
    if (result.error) {
      setStatus("ready");
      setMessage(result.error.message);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...draft,
        signals: validation.signals,
        submitted: true,
        updatedAt: new Date().toISOString(),
      }),
    );
    router.push("/desire-map");
    router.refresh();
  }

  if (!started)
    return (
      <main className="landing-shell">
        <section className="landing-hero">
          <p className="eyebrow">大学生现实探索 · 免费开始</p>
          <h1>
            迷茫不是因为你缺答案，
            <br />
            而是因为你缺现实证据。
          </h1>
          <p className="lede">
            7
            次小行动，把“我不知道做什么”变成能继续、能排除、能验证的判断。方向不是想出来的，是验证出来的。
          </p>
          <button
            className="primary-button landing-cta"
            disabled={status === "loading" || status === "error"}
            onClick={() => {
              setStarted(true);
              void trackProductEvent("exploration_started");
            }}
            type="button"
          >
            免费完成任务 1
          </button>
          <p className="privacy-note">
            无需年级、学校、专业或邮箱。匿名开始，自动保存。
          </p>
        </section>
        <section className="difference-strip" aria-label="产品不是什么">
          <div>
            <strong>不是职业测试</strong>
            <span>不靠标签替你下结论</span>
          </div>
          <div>
            <strong>不是 AI 人生导师</strong>
            <span>答案来自你的现实行动</span>
          </div>
          <div>
            <strong>不是内容资料库</strong>
            <span>每次只推进一个任务</span>
          </div>
        </section>
        {message ? (
          <p className="form-message landing-error" role="alert">
            {message}
          </p>
        ) : null}
      </main>
    );

  const signal = draft.signals[draft.step];
  const labels =
    LABELS[signal.type === "LEGACY" ? SIGNAL_TYPES[draft.step] : signal.type];
  return (
    <main className="shell narrow-shell wizard-shell">
      <header className="task-header">
        <p className="day-marker">任务 1 / 7 · 问题 {draft.step + 1} / 3</p>
        <div
          className="progress-track"
          aria-label={`第 ${draft.step + 1} 个问题，共 3 个`}
        >
          <span style={{ width: `${((draft.step + 1) / 3) * 100}%` }} />
        </div>
      </header>
      <section className="wizard-question">
        <p className="eyebrow">{labels.eyebrow}</p>
        <h1>{labels.title}</h1>
        <p className="question-hint">{labels.hint}</p>
        <label>
          {labels.source}
          <textarea
            autoFocus
            value={signal.source}
            onBlur={() => void persist(latestRef.current)}
            onChange={(event) => update("source", event.target.value)}
            placeholder="写一个最近发生的具体例子"
          />
        </label>
        <label>
          {labels.attraction}
          <textarea
            value={signal.attraction}
            onBlur={() => void persist(latestRef.current)}
            onChange={(event) => update("attraction", event.target.value)}
            placeholder="我真正想靠近的是……"
          />
        </label>
        <div className="chip-group" aria-label="快速选择吸引你的部分">
          {CHIPS.map((chip) => (
            <button
              aria-pressed={signal.quickChips.includes(chip)}
              className="choice-chip"
              key={chip}
              onClick={() =>
                update(
                  "quickChips",
                  signal.quickChips.includes(chip)
                    ? signal.quickChips.filter((item) => item !== chip)
                    : [...signal.quickChips, chip],
                )
              }
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
        <label>
          你愿意先承担什么小代价？
          <input
            value={signal.willingCost}
            onBlur={() => void persist(latestRef.current)}
            onChange={(event) => update("willingCost", event.target.value)}
            placeholder="例如：周六拿出 2 小时，并接受一次被拒绝"
          />
        </label>
        {signal.source && signal.attraction && signal.willingCost ? (
          <p className="signal-feedback" role="status">
            {signalFeedback(signal)}
          </p>
        ) : null}
      </section>
      <div className="wizard-actions">
        {draft.step > 0 ? (
          <button
            className="secondary-button"
            onClick={() =>
              setDraft((current) => ({ ...current, step: current.step - 1 }))
            }
            type="button"
          >
            上一个
          </button>
        ) : (
          <span />
        )}
        <button
          className="primary-button"
          disabled={status === "saving"}
          onClick={next}
          type="button"
        >
          {status === "saving"
            ? "正在生成…"
            : draft.step === 2
              ? "生成我的欲望地图"
              : "保存并继续"}
        </button>
      </div>
      <p className="save-status" data-state={saveState} role="status">
        {saveState === "saving"
          ? "正在同步…"
          : saveState === "saved"
            ? "已保存"
            : saveState === "offline"
              ? "离线保存于当前设备，联网后自动同步"
              : saveState === "error"
                ? "云端同步失败，本地草稿仍在"
                : "填写后自动保存"}
      </p>
      {message ? (
        <p className="form-message" role="alert">
          {message}
        </p>
      ) : null}
    </main>
  );
}
