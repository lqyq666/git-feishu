import { describe, expect, it } from "vitest";
import { commitmentOutcome, lockedRulesChanged, requiresRecovery, validateCommitment, type CommitmentRules } from "./domain";
const rules: CommitmentRules = { actionStatement: "周六十点联系一位真实从业者", startsAt: "2026-09-01T01:00:00Z", dueAt: "2026-09-01T03:00:00Z", timezone: "Asia/Shanghai", successRule: "发出一条具体询问", evidenceRequirement: "发送截图", rewardText: "去散步", recoveryAction: "改为只整理问题并在次日发出", mode: "PRIVATE" };
describe("commitments", () => {
  it("locks key rules", () => expect(lockedRulesChanged(rules, { ...rules, successRule: "随便看看" })).toBe(true));
  it("only becomes overdue after grace", () => expect(commitmentOutcome(rules.dueAt, 60, new Date("2026-09-01T03:30:00Z"))).toBe("OPEN"));
  it("requires recovery after not completed", () => expect(requiresRecovery("NOT_COMPLETED")).toBe(true));
  it("accepts a concrete commitment", () => expect(validateCommitment(rules)).toBeNull());
});
