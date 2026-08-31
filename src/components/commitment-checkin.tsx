"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackProductEvent } from "@/lib/analytics/client";
export function CommitmentCheckin({
  id,
  action,
  dueAt,
  overdue,
  recoveryAction,
}: {
  id: string;
  action: string;
  dueAt: string;
  overdue: boolean;
  recoveryAction: string;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<"" | "COMPLETED" | "NOT_COMPLETED">("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!choice || note.trim().length < (choice === "COMPLETED" ? 2 : 4)) {
      setMessage(
        choice === "COMPLETED" ? "请写下完成证据。" : "请记录这次真正的阻力。",
      );
      return;
    }
    setSaving(true);
    const result = await createSupabaseBrowserClient().rpc(
      "record_commitment_outcome",
      { target_commitment: id, outcome: choice, proof_or_friction: note },
    );
    if (result.error) {
      setMessage(result.error.message);
      setSaving(false);
      return;
    }
    void trackProductEvent(
      choice === "COMPLETED"
        ? "commitment_completed"
        : "commitment_not_completed",
    );
    if (choice === "NOT_COMPLETED") void trackProductEvent("recovery_started");
    router.refresh();
  }
  return (
    <section className="commitment-panel">
      <p className="eyebrow">我的行动承诺</p>
      <h2>{action}</h2>
      <p>
        截止：
        {new Intl.DateTimeFormat("zh-CN", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(dueAt))}
      </p>
      {!overdue ? (
        <p className="status-good">承诺仍在进行中。完成后回来留下证据。</p>
      ) : (
        <>
          <p>截止与宽限期已过。选择真实发生的结果，不需要羞辱自己。</p>
          <div className="segmented">
            <button
              aria-pressed={choice === "COMPLETED"}
              onClick={() => setChoice("COMPLETED")}
              type="button"
            >
              我已经完成
            </button>
            <button
              aria-pressed={choice === "NOT_COMPLETED"}
              onClick={() => setChoice("NOT_COMPLETED")}
              type="button"
            >
              这次未完成
            </button>
          </div>
          {choice ? (
            <label>
              {choice === "COMPLETED" ? "完成证据" : "真正卡住我的阻力"}
              <textarea
                onChange={(event) => setNote(event.target.value)}
                value={note}
                placeholder={
                  choice === "COMPLETED"
                    ? "例如：已发送的消息、作品链接或结果描述"
                    : "例如：动作仍太大；联系对象不明确"
                }
              />
            </label>
          ) : null}
          {choice === "NOT_COMPLETED" ? (
            <p className="recovery-preview">
              <strong>系统将启动你事先约定的恢复动作：</strong>
              {recoveryAction}
            </p>
          ) : null}
          {choice ? (
            <button
              className="primary-button"
              disabled={saving}
              onClick={submit}
              type="button"
            >
              {saving ? "正在记录…" : "确认真实结果"}
            </button>
          ) : null}
        </>
      )}
      {message ? (
        <p className="form-message" role="alert">
          {message}
        </p>
      ) : null}
    </section>
  );
}
