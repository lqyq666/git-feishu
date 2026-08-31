export type ShareCardType = "DESIRE_MAP" | "DISCOVERY" | "COMMITMENT_SUCCESS" | "COMMITMENT_NOT_COMPLETED" | "FINAL_REPORT";
const PRIVATE_KEYS = /email|user_?id|anonymous_?id|supabase|real_?name|storage_?path|internal/i;
const SHAMING = /我很失败|废物|没用|丢脸|惩罚自己/;
export function sanitizeSharePayload(input: Record<string, unknown>) { return Object.fromEntries(Object.entries(input).filter(([key]) => !PRIVATE_KEYS.test(key)).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])); }
export function isSafeShareCopy(copy: string) { return !SHAMING.test(copy); }
export const SHARE_COPY: Record<ShareCardType, string> = { DESIRE_MAP: "我没有急着选方向，先找到了三条值得验证的现实信号。", DISCOVERY: "我用一次现实行动，修正了一个关于未来的想象。", COMMITMENT_SUCCESS: "我做到了：不是想通了，而是完成了一次可以检查的行动。", COMMITMENT_NOT_COMPLETED: "这次没有完成。我记录了阻力，也已经约定下一次更小的恢复动作。", FINAL_REPORT: "方向不是想出来的，是一次次验证出来的。" };
