import { describe, expect, it } from "vitest";
import { validateDayOne } from "./domain";

describe("validateDayOne", () => {
  it("requires all three signals", () => {
    const result = validateDayOne([
      { admiredPerson: "A", admiredQuality: "行动", acceptedCost: "花时间" },
    ]);
    expect(result.complete).toBe(false);
  });

  it("rejects an incomplete signal", () => {
    const result = validateDayOne([
      { admiredPerson: "A", admiredQuality: "行动", acceptedCost: "花时间" },
      { admiredPerson: "B", admiredQuality: "", acceptedCost: "被拒绝" },
      { admiredPerson: "C", admiredQuality: "作品", acceptedCost: "练习" },
    ]);
    expect(result.complete).toBe(false);
  });

  it("normalizes and accepts three complete signals", () => {
    const result = validateDayOne([
      { admiredPerson: "  学长  ", admiredQuality: "持续输出", acceptedCost: "每周 4 小时" },
      { admiredPerson: "朋友", admiredQuality: "敢于沟通", acceptedCost: "被拒绝" },
      { admiredPerson: "老师", admiredQuality: "研究问题", acceptedCost: "做枯燥记录" },
    ]);
    expect(result.complete).toBe(true);
    if (result.complete) expect(result.signals[0].admiredPerson).toBe("学长");
  });
});
