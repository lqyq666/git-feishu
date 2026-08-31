import { describe, expect, it } from "vitest";
import { isSafeShareCopy, sanitizeSharePayload, SHARE_COPY } from "./domain";
describe("share privacy", () => {
  it("removes identity and internal fields", () => expect(sanitizeSharePayload({ email: "a@b.com", user_id: "1", discovery: "我更喜欢访谈" })).toEqual({ discovery: "我更喜欢访谈" }));
  it("ships no shame copy", () => { expect(Object.values(SHARE_COPY).every(isSafeShareCopy)).toBe(true); expect(isSafeShareCopy("我很失败")).toBe(false); });
});
