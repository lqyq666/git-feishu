export type CommitmentMode = "PRIVATE" | "WITNESS" | "PUBLIC";
export type CommitmentStatus = "DRAFT" | "LOCKED" | "ACTIVE" | "EVIDENCE_SUBMITTED" | "COMPLETED" | "NOT_COMPLETED" | "RECOVERY_ACTIVE" | "CLOSED";
export type CommitmentRules = { actionStatement: string; startsAt: string; dueAt: string; timezone: string; successRule: string; evidenceRequirement: string; rewardText: string; recoveryAction: string; mode: CommitmentMode };
export function commitmentOutcome(dueAt: string, graceMinutes: number, now = new Date()) { return now.getTime() > new Date(dueAt).getTime() + graceMinutes * 60_000 ? "OVERDUE" : "OPEN"; }
export function lockedRulesChanged(original: CommitmentRules, next: CommitmentRules) { return (Object.keys(original) as (keyof CommitmentRules)[]).some((key) => original[key] !== next[key]); }
export function requiresRecovery(status: CommitmentStatus) { return status === "NOT_COMPLETED"; }
export function validateCommitment(rules: CommitmentRules) {
  if (rules.actionStatement.trim().length < 8) return "把动作写到别人也能判断是否完成。";
  if (!rules.startsAt || !rules.dueAt || Date.parse(rules.dueAt) <= Date.parse(rules.startsAt)) return "截止时间必须晚于开始时间。";
  if (rules.successRule.trim().length < 4 || rules.evidenceRequirement.trim().length < 2) return "请写清成功标准和要留下的证据。";
  if (rules.recoveryAction.trim().length < 4) return "先约定未完成后的恢复动作。";
  return null;
}
