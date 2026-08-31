"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isDifferentExperimentDirection, type ExplorationTask, validateTaskEvidence } from "@/lib/exploration/tasks";

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export function DailyTaskWorkspace({
  explorationId,
  task,
  initialContent,
  experimentADirection,
}: {
  explorationId: string;
  task: ExplorationTask;
  initialContent: Record<string, string>;
  experimentADirection?: string;
}) {
  const router = useRouter();
  const initialValues = useMemo(
    () => Object.fromEntries(task.fields.map((field) => [field.name, initialContent[field.name] ?? ""])),
    [initialContent, task.fields],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const initialSnapshot = useRef(JSON.stringify(initialValues));

  useEffect(() => {
    const snapshot = JSON.stringify(values);
    if (snapshot === initialSnapshot.current || submitting) return;
    setSaveState("unsaved");
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.from("evidence").upsert({
        exploration_id: explorationId,
        kind: task.evidenceKind,
        position: 1,
        content: values,
        source: "USER_REPORTED",
        confidence: 3,
        status: "DRAFT",
        updated_at: new Date().toISOString(),
      }, { onConflict: "exploration_id,kind,position" });
      if (error) {
        setSaveState("error");
        return;
      }
      initialSnapshot.current = snapshot;
      setSaveState("saved");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [explorationId, submitting, task.evidenceKind, values]);

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setMessage("");
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateTaskEvidence(task, values);
    if (!validation.complete) {
      setMessage(validation.message);
      return;
    }
    if (task.day === 6 && experimentADirection && !isDifferentExperimentDirection(experimentADirection, validation.content.direction)) {
      setMessage(`实验 B 需要换一个明显不同的方向，不能继续填写“${experimentADirection}”。`);
      return;
    }
    setSubmitting(true);
    setSaveState("saving");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: evidenceError } = await supabase.from("evidence").upsert({
        exploration_id: explorationId,
        kind: task.evidenceKind,
        position: 1,
        content: validation.content,
        source: "USER_REPORTED",
        confidence: 3,
        status: "SUBMITTED",
        updated_at: new Date().toISOString(),
      }, { onConflict: "exploration_id,kind,position" });
      if (evidenceError) throw evidenceError;

      if (task.day === 2) {
        const { data: activeHypothesis, error: activeError } = await supabase
          .from("direction_hypotheses")
          .select("id")
          .eq("exploration_id", explorationId)
          .eq("status", "ACTIVE")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (activeError) throw activeError;
        const hypothesis = {
          exploration_id: explorationId,
          source_evidence_position: 1,
          question: validation.content.question,
          smallest_action: validation.content.smallestAction,
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        };
        const hypothesisResult = activeHypothesis
          ? await supabase.from("direction_hypotheses").update(hypothesis).eq("id", activeHypothesis.id)
          : await supabase.from("direction_hypotheses").insert(hypothesis);
        if (hypothesisResult.error) throw hypothesisResult.error;
      }

      const { error: progressError } = await supabase
        .from("explorations")
        .update({
          state: task.nextState,
          current_day: task.nextDay,
          updated_at: new Date().toISOString(),
        })
        .eq("id", explorationId);
      if (progressError) throw progressError;
      router.push("/progress");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，你填写的内容仍保留在页面中，请重试。");
      setSaveState("error");
      setSubmitting(false);
    }
  }

  const saveText = saveState === "saving"
    ? "正在保存草稿…"
    : saveState === "saved"
      ? "草稿已保存"
      : saveState === "error"
        ? "草稿保存失败，请保持页面开启并重试"
        : saveState === "unsaved"
          ? "有尚未保存的修改"
          : initialContent && Object.keys(initialContent).length > 0
            ? "已恢复上次草稿"
            : "填写后自动保存";

  return (
    <form className="workspace" onSubmit={submitEvidence}>
      <section className="task-brief" aria-labelledby="task-objective">
        <h2 id="task-objective">今天只完成这一件事</h2>
        <p>{task.objective}</p>
        <ol>{task.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
      </section>
      <p className="save-status" data-state={saveState} role="status">{saveText}</p>
      <section className="evidence-form" aria-label={`Day ${task.day} 现实证据`}>
        {task.fields.map((field) => (
          <label key={field.name}>{field.label}{field.optional ? <span className="optional-label">可选</span> : null}
            {field.control === "textarea" ? (
              <textarea value={values[field.name]} onChange={(event) => updateValue(field.name, event.target.value)} placeholder={field.placeholder} />
            ) : field.control === "select" ? (
              <select value={values[field.name]} onChange={(event) => updateValue(field.name, event.target.value)}>
                <option value="">{field.placeholder}</option>
                {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : (
              <input value={values[field.name]} onChange={(event) => updateValue(field.name, event.target.value)} placeholder={field.placeholder} />
            )}
          </label>
        ))}
      </section>
      <div className="completion-bar">
        <div><strong>完成标准</strong><p>{task.completionCriteria}</p></div>
        <button className="primary-button" disabled={submitting} type="submit">{submitting ? "正在提交证据…" : task.day === 7 ? "完成本轮探索" : `提交证据，进入 Day ${task.nextDay}`}</button>
      </div>
      {message ? <p className="form-message" role="alert">{message}</p> : null}
    </form>
  );
}
