export const TASK_COUNT = 7;
export const DAY_ONE_SIGNAL_COUNT = 3;
export const SIGNAL_TYPES = ["ENVY", "CURIOSITY", "DISSATISFACTION"] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number] | "LEGACY";
export type DesireSignal = { type: SignalType; source: string; attraction: string; willingCost: string; quickChips: string[] };
export type LegacyDesireSignal = { admiredPerson: string; admiredQuality: string; acceptedCost: string };
export type ExplorationState = "UNKNOWN" | "EXPLORING_DESIRE" | "DAY_2_READY" | "DAY_2_ACTIVE" | "DAY_3_READY" | "DAY_4_READY" | "DAY_5_READY" | "DAY_6_READY" | "DAY_7_READY" | "ROUND_COMPLETE";
export type StageJudgment = "CONTINUE" | "REJECT" | "INSUFFICIENT" | "NEXT_EXPERIMENT";
const clean = (value: string) => value.trim().replace(/\s+/g, " ");

export function normalizeSignal(value: Partial<DesireSignal> & Partial<LegacyDesireSignal>, index = 0): DesireSignal {
  if ("admiredPerson" in value || "admiredQuality" in value || "acceptedCost" in value) return { type: "LEGACY", source: clean(value.admiredPerson ?? ""), attraction: clean(value.admiredQuality ?? ""), willingCost: clean(value.acceptedCost ?? ""), quickChips: [] };
  return { type: value.type ?? SIGNAL_TYPES[index] ?? "LEGACY", source: clean(value.source ?? ""), attraction: clean(value.attraction ?? ""), willingCost: clean(value.willingCost ?? ""), quickChips: Array.isArray(value.quickChips) ? value.quickChips.map(clean).filter(Boolean) : [] };
}

export type DayOneValidation = { complete: true; signals: DesireSignal[] } | { complete: false; message: string; signalIndex?: number; field?: keyof DesireSignal };
export function validateDayOne(signals: DesireSignal[]): DayOneValidation {
  if (signals.length !== DAY_ONE_SIGNAL_COUNT) return { complete: false, message: "需要完成三类现实信号。" };
  const normalized = signals.map(normalizeSignal);
  const fields: [keyof DesireSignal, string][] = [["source", "现实来源"], ["attraction", "真正吸引你的部分"], ["willingCost", "愿意承担的代价"]];
  for (let index = 0; index < normalized.length; index += 1) for (const [field, label] of fields) if (!normalized[index][field] || String(normalized[index][field]).length < 2) return { complete: false, message: `请补充第 ${index + 1} 条的${label}。`, signalIndex: index, field };
  return { complete: true, signals: normalized };
}

export function signalFeedback(signal: DesireSignal) {
  const labels: Record<SignalType, string> = { ENVY: "你羡慕的可能不是身份，而是这种可见的生活状态。", CURIOSITY: "反复想靠近，说明这里值得用一次小行动换取证据。", DISSATISFACTION: "不满也在提供方向：它指出了你不愿继续接受的现实。", LEGACY: "这条旧信号已保留，下一步会用现实行动验证它。" };
  return `${labels[signal.type]} 你愿意承担“${signal.willingCost || "一小步代价"}”，这比单纯喜欢更接近可验证信号。`;
}

export function resolveNewestDraft<T extends { revision: number; updatedAt: string; submitted?: boolean }>(local: T | null, server: T | null) {
  if (server?.submitted) return server;
  if (!local) return server;
  if (!server) return local;
  if (local.revision !== server.revision) return local.revision > server.revision ? local : server;
  return Date.parse(local.updatedAt) > Date.parse(server.updatedAt) ? local : server;
}

export function inferStageJudgment(values: { continueDirection?: string; rejectedDirection?: string; insufficientDirection?: string; nextExperiment?: string }) {
  const result: StageJudgment[] = [];
  if (clean(values.continueDirection ?? "")) result.push("CONTINUE");
  if (clean(values.rejectedDirection ?? "")) result.push("REJECT");
  if (clean(values.insufficientDirection ?? "")) result.push("INSUFFICIENT");
  if (clean(values.nextExperiment ?? "")) result.push("NEXT_EXPERIMENT");
  return result;
}
