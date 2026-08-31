export const FULL_PRODUCT_KEY = "exploration_full_v1";
export type AccessLevel = "FREE" | "FULL_EXPLORATION";
export type Entitlement = { accessLevel: AccessLevel; startsAt: string; expiresAt?: string | null; revokedAt?: string | null };
export function hasFullAccess(items: Entitlement[], now = new Date()) { return items.some((item) => item.accessLevel === "FULL_EXPLORATION" && !item.revokedAt && new Date(item.startsAt) <= now && (!item.expiresAt || new Date(item.expiresAt) > now)); }
export function canAccessTask(taskNumber: number, entitlements: Entitlement[], now = new Date()) { return taskNumber === 1 || hasFullAccess(entitlements, now); }
