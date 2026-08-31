import { describe, expect, it } from "vitest";
import { normalizeSignal, resolveNewestDraft, shouldRestoreLocalTaskDraft, validateDayOne } from "./domain";

const signal = (type: "ENVY" | "CURIOSITY" | "DISSATISFACTION", source: string, attraction = "持续行动", willingCost = "每周投入四小时") => ({ type, source, attraction, willingCost, quickChips: [] });

describe("validateDayOne", () => {
  it("requires all three signals", () => {
    const result = validateDayOne([
      signal("ENVY", "学长"),
    ]);
    expect(result.complete).toBe(false);
  });

  it("rejects an incomplete signal", () => {
    const result = validateDayOne([
      signal("ENVY", "学长"), signal("CURIOSITY", "产品", ""), signal("DISSATISFACTION", "重复内耗"),
    ]);
    expect(result.complete).toBe(false);
  });

  it("normalizes and accepts three complete signals", () => {
    const result = validateDayOne([
      signal("ENVY", "  学长  "), signal("CURIOSITY", "真实项目"), signal("DISSATISFACTION", "只收藏不行动"),
    ]);
    expect(result.complete).toBe(true);
    if (result.complete) expect(result.signals[0].source).toBe("学长");
  });

  it("maps legacy signals without losing content", () => {
    expect(normalizeSignal({ admiredPerson: "学姐", admiredQuality: "作品", acceptedCost: "练习" })).toMatchObject({ type: "LEGACY", source: "学姐", attraction: "作品", willingCost: "练习" });
  });

  it("never overwrites submitted server data with a stale local draft", () => {
    const local = { revision: 8, updatedAt: "2026-08-31T12:00:00Z", value: "local" };
    const server = { revision: 7, updatedAt: "2026-08-31T11:00:00Z", value: "server", submitted: true };
    expect(resolveNewestDraft(local, server)).toBe(server);
  });

  it("restores local wizard position when content revisions are equal", () => {
    expect(shouldRestoreLocalTaskDraft(8, 8)).toBe(true);
    expect(shouldRestoreLocalTaskDraft(8, 8, true)).toBe(false);
  });
});
