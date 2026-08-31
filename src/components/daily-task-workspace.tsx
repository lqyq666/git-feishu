"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  isDifferentExperimentDirection,
  type ExplorationTask,
  validateTaskEvidence,
} from "@/lib/exploration/tasks";
import { shouldRestoreLocalTaskDraft } from "@/lib/exploration/domain";

type SaveState = "idle" | "saving" | "saved" | "offline" | "error";
type StoredDraft = {
  values: Record<string, string>;
  fieldIndex: number;
  revision: number;
  updatedAt: string;
  submitted?: boolean;
};

export function DailyTaskWorkspace({
  explorationId,
  task,
  initialContent,
  initialRevision = 1,
  experimentADirection,
}: {
  explorationId: string;
  task: ExplorationTask;
  initialContent: Record<string, string>;
  initialRevision?: number;
  experimentADirection?: string;
}) {
  const router = useRouter();
  const storageKey = `exploration:vnext:task-${task.day}:${explorationId}`;
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        task.fields.map((field) => [
          field.name,
          initialContent[field.name] ??
            (field.name === "commitmentMode" ? "PRIVATE" : ""),
        ]),
      ),
    [initialContent, task.fields],
  );
  const [draft, setDraft] = useState<StoredDraft>(() => {
    if (typeof window !== "undefined")
      try {
        const local = JSON.parse(
          localStorage.getItem(storageKey) ?? "null",
        ) as StoredDraft | null;
        if (local && !local.submitted && shouldRestoreLocalTaskDraft(local.revision, initialRevision))
          return local;
      } catch {
        /* ignore invalid device draft */
      }
    return {
      values: initialValues,
      fieldIndex: 0,
      revision: initialRevision,
      updatedAt: new Date().toISOString(),
    };
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const latest = useRef(draft);
  const lastServerRevision = useRef(initialRevision);

  const persist = useCallback(
    async (value: StoredDraft) => {
      localStorage.setItem(storageKey, JSON.stringify(value));
      if (value.submitted || value.revision <= lastServerRevision.current)
        return;
      if (!navigator.onLine) {
        setSaveState("offline");
        return;
      }
      setSaveState("saving");
      const supabase = createSupabaseBrowserClient();
      const saved = await supabase.rpc("save_exploration_task_draft", {
        target_exploration: explorationId,
        target_task: task.day,
        payload: value.values,
        client_revision: value.revision,
      });
      if (saved.error) {
        setSaveState("error");
        return;
      }
      lastServerRevision.current = Math.max(
        value.revision,
        saved.data?.revision ?? 0,
      );
      setSaveState("saved");
    },
    [explorationId, storageKey, task.day],
  );

  useEffect(() => {
    latest.current = draft;
    if (draft.submitted) return;
    localStorage.setItem(storageKey, JSON.stringify(draft));
    const timer = window.setTimeout(() => void persist(draft), 1000);
    return () => clearTimeout(timer);
  }, [draft, persist, storageKey]);
  useEffect(() => {
    const flush = () => void persist(latest.current);
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

  const field = task.fields[draft.fieldIndex];
  const value = draft.values[field.name] ?? "";
  function update(next: string) {
    setMessage("");
    setDraft((current) => ({
      ...current,
      values: { ...current.values, [field.name]: next },
      revision: current.revision + 1,
      updatedAt: new Date().toISOString(),
    }));
  }
  function advance() {
    if (
      !field.optional &&
      (!value.trim() || value.trim().length < (field.minLength ?? 1))
    ) {
      setMessage(`请补充“${field.label}”，让它足够具体。`);
      return;
    }
    if (
      task.day === 6 &&
      field.name === "direction" &&
      experimentADirection &&
      !isDifferentExperimentDirection(experimentADirection, value)
    ) {
      setMessage(
        `实验 B 必须换一个明显不同的方向，不能继续“${experimentADirection}”。`,
      );
      return;
    }
    if (draft.fieldIndex < task.fields.length - 1)
      setDraft((current) => ({
        ...current,
        fieldIndex: current.fieldIndex + 1,
      }));
    else void submit();
  }
  function evidencePayload(values: Record<string, string>) {
    if (task.day === 3)
      return [
        {
          evidence_type: "OUTREACH_SENT",
          content: values.outreachCopy,
          metadata: { reply_state: values.replyState },
        },
        ...(values.replyState === "REPLIED"
          ? [{ evidence_type: "REPLY", content: values.replyFinding }]
          : [
              {
                evidence_type: "TEXT",
                content: values.replyFinding,
                metadata: { no_reply: true },
              },
            ]),
      ];
    if (task.day === 4 || task.day === 6)
      return [
        {
          evidence_type: "EXPERIMENT_OUTPUT",
          content: values.artifact,
          external_url: values.artifactLink || undefined,
          metadata: { direction: values.direction },
        },
      ];
    if (task.day === 5)
      return [
        {
          evidence_type: "FEEDBACK",
          content: values.unclear,
          metadata: { state: values.feedbackState, requested: true },
        },
      ];
    return [
      {
        evidence_type: "TEXT",
        content:
          task.day === 2
            ? values.realitySample
            : (values.nextExperiment ?? "现实判断"),
        metadata: { task: task.day },
      },
    ];
  }
  async function submit() {
    const validation = validateTaskEvidence(task, draft.values);
    if (!validation.complete) {
      const badIndex = task.fields.findIndex((item) =>
        validation.message.includes(item.label),
      );
      setDraft((current) => ({
        ...current,
        fieldIndex: Math.max(badIndex, 0),
      }));
      setMessage(validation.message);
      return;
    }
    setSubmitting(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (task.day === 2) {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setMessage("会话已失效，请刷新后重试。");
        setSubmitting(false);
        return;
      }
      const commitment = await supabase
        .from("commitments")
        .insert({
          exploration_id: explorationId,
          user_id: user.id,
          mode: validation.content.commitmentMode,
          status: "ACTIVE",
          action_statement: validation.content.smallestAction,
          starts_at: new Date(validation.content.startsAt).toISOString(),
          due_at: new Date(validation.content.dueAt).toISOString(),
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
          success_rule: validation.content.successRule,
          evidence_requirement: validation.content.evidenceRequirement,
          reward_text: validation.content.rewardText,
          recovery_action: validation.content.recoveryAction,
          witness_label: validation.content.witnessLabel || null,
        })
        .select("id")
        .single();
      if (commitment.error) {
        setMessage(commitment.error.message);
        setSubmitting(false);
        return;
      }
    }
    const result = await supabase.rpc("submit_exploration_task", {
      target_exploration: explorationId,
      target_task: task.day,
      payload: validation.content,
      evidence_payload: evidencePayload(validation.content),
    });
    if (result.error) {
      setMessage(result.error.message);
      setSubmitting(false);
      setSaveState("error");
      return;
    }
    const complete = {
      ...draft,
      values: validation.content,
      submitted: true,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(complete));
    router.push("/progress");
    router.refresh();
  }

  return (
    <section className="task-wizard" aria-busy={submitting}>
      <div className="task-brief">
        <h2>这次只完成一件事</h2>
        <p>{task.objective}</p>
        <details>
          <summary>为什么做、怎样才算完成</summary>
          <ol>
            {task.instructions.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
          <p>
            <strong>完成标准：</strong>
            {task.completionCriteria}
          </p>
        </details>
      </div>
      <div className="field-progress">
        <span>
          问题 {draft.fieldIndex + 1} / {task.fields.length}
        </span>
        <div className="progress-track">
          <span
            style={{
              width: `${((draft.fieldIndex + 1) / task.fields.length) * 100}%`,
            }}
          />
        </div>
      </div>
      <div className="single-field">
        <label htmlFor={field.name}>
          {field.label}
          {field.optional ? <span className="optional-label">可选</span> : null}
        </label>
        {field.control === "textarea" ? (
          <textarea
            autoFocus
            id={field.name}
            onBlur={() => void persist(latest.current)}
            onChange={(event) => update(event.target.value)}
            placeholder={field.placeholder}
            value={value}
          />
        ) : field.control === "select" ? (
          <select
            autoFocus
            id={field.name}
            onBlur={() => void persist(latest.current)}
            onChange={(event) => update(event.target.value)}
            value={value}
          >
            <option value="">{field.placeholder}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            id={field.name}
            onBlur={() => void persist(latest.current)}
            onInput={(event) => update(event.currentTarget.value)}
            placeholder={field.placeholder}
            type={field.inputType ?? "text"}
            value={value}
          />
        )}
        {task.day === 2 && field.name === "recoveryAction" ? (
          <p className="field-note">
            未完成不会触发公开羞辱。你只需要记录阻力，并执行这条更小的恢复动作。
          </p>
        ) : null}
      </div>
      <div className="wizard-actions">
        {draft.fieldIndex > 0 ? (
          <button
            className="secondary-button"
            onClick={() =>
              setDraft((current) => ({
                ...current,
                fieldIndex: current.fieldIndex - 1,
              }))
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
          disabled={submitting}
          onClick={advance}
          type="button"
        >
          {submitting
            ? "正在提交证据…"
            : draft.fieldIndex === task.fields.length - 1
              ? task.day === 7
                ? "生成完整报告"
                : "提交这次现实证据"
              : "保存并继续"}
        </button>
      </div>
      <p className="save-status" data-state={saveState} role="status">
        {saveState === "saving"
          ? "正在同步草稿…"
          : saveState === "saved"
            ? "草稿已保存"
            : saveState === "offline"
              ? "离线保存于当前设备"
              : saveState === "error"
                ? "云端保存失败，本地草稿仍在"
                : Object.keys(initialContent).length
                  ? "已恢复上次草稿"
                  : "填写后自动保存"}
      </p>
      {message ? (
        <p className="form-message" role="alert">
          {message}
        </p>
      ) : null}
    </section>
  );
}
