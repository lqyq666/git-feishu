import { describe, expect, it } from "vitest";
import { getExplorationTask, isDifferentExperimentDirection, validateTaskEvidence } from "./tasks";

describe("exploration tasks", () => {
  it("defines every evidence-driven task from Day 2 through Day 7", () => {
    expect([2, 3, 4, 5, 6, 7].every((day) => getExplorationTask(day))).toBe(true);
  });

  it("does not complete a task with vague evidence", () => {
    const task = getExplorationTask(3)!;
    const result = validateTaskEvidence(task, {
      contactRole: "学长",
      recentWork: "聊了",
    });
    expect(result.complete).toBe(false);
  });

  it("allows the optional Day 7 evidence-insufficient direction to remain empty", () => {
    const task = getExplorationTask(7)!;
    const values = Object.fromEntries(task.fields.map((field) => [field.name, field.optional ? "" : "这是一条足够具体并且可以验证的现实证据内容"]));
    const result = validateTaskEvidence(task, values);
    expect(result.complete).toBe(true);
  });

  it("requires experiment B to use a different direction", () => {
    expect(isDifferentExperimentDirection("产品经理", " 产品经理 ")).toBe(false);
    expect(isDifferentExperimentDirection("产品经理", "内容创作")).toBe(true);
  });
});
