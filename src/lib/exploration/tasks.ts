import type { ExplorationState } from "./domain";

export type EvidenceKind =
  | "DAY_2_REALITY_SCAN"
  | "DAY_3_HUMAN_CONTACT"
  | "DAY_4_EXPERIMENT_A"
  | "DAY_5_REAL_FEEDBACK"
  | "DAY_6_EXPERIMENT_B"
  | "DAY_7_DECISION";

export type TaskField = {
  name: string;
  label: string;
  placeholder: string;
  minLength?: number;
  optional?: boolean;
  control?: "input" | "textarea" | "select";
  options?: { label: string; value: string }[];
  inputType?: "text" | "url" | "datetime-local";
};

export type ExplorationTask = {
  day: number;
  title: string;
  objective: string;
  instructions: string[];
  completionCriteria: string;
  evidenceKind: EvidenceKind;
  fields: TaskField[];
  nextState: ExplorationState;
  nextDay: number;
};

const scoreOptions = [1, 2, 3, 4, 5].map((score) => ({
  label: `${score} 分`,
  value: String(score),
}));

export const EXPLORATION_TASKS: Record<number, ExplorationTask> = {
  2: {
    day: 2,
    title: "不要想象方向，先看一份真实样本。",
    objective: "把一个模糊方向变成可以继续调查的现实假设。",
    instructions: ["只调查一个方向。", "优先使用真实从业者、岗位说明或公开作品。", "记录日常工作和痛苦部分，不只记录光鲜结果。"],
    completionCriteria: "提交一个现实样本、真实工作内容、困难和下一步验证动作。",
    evidenceKind: "DAY_2_REALITY_SCAN",
    fields: [
      { name: "selectedSignal", label: "这次选择验证的信号", placeholder: "例如：我羡慕能把模糊问题做成作品", minLength: 4 },
      { name: "candidateDirection", label: "我调查的候选方向", placeholder: "例如：产品经理", minLength: 2 },
      { name: "realitySample", label: "我查看的真实样本", placeholder: "例如：一位产品实习生最近一周的工作记录", minLength: 4 },
      { name: "actualWork", label: "这个方向日常真正做什么", placeholder: "写具体动作，不写‘很有发展’之类评价。", minLength: 8, control: "textarea" },
      { name: "hardPart", label: "最痛苦或最容易被忽略的部分", placeholder: "什么会让我想放弃？", minLength: 8, control: "textarea" },
      { name: "realCost", label: "真实成本", placeholder: "时间、金钱、拒绝、枯燥或能力门槛。", minLength: 4, control: "textarea" },
      { name: "question", label: "我现在最需要验证的问题", placeholder: "例如：我是否愿意持续做用户访谈？", minLength: 8, control: "textarea" },
      { name: "smallestAction", label: "下一步最小现实动作", placeholder: "例如：本周约一位产品实习生访谈 20 分钟。", minLength: 8, control: "textarea" },
      { name: "actionWhen", label: "何时完成", placeholder: "例如：周六 10:00", minLength: 4 },
      { name: "actionWhere", label: "在哪里完成", placeholder: "例如：图书馆二楼", minLength: 2 },
      { name: "actionProof", label: "留下什么证据", placeholder: "例如：发出的消息截图", minLength: 4 },
      { name: "actionDeadline", label: "最晚截止时间", placeholder: "例如：本周日 20:00", minLength: 4 },
      { name: "commitmentMode", label: "这份承诺如何被看见", placeholder: "请选择", control: "select", options: [{ label: "只对自己可见（默认）", value: "PRIVATE" }, { label: "告诉一位见证人", value: "WITNESS" }, { label: "我可能会主动公开", value: "PUBLIC" }] },
      { name: "startsAt", label: "承诺开始时间", placeholder: "", inputType: "datetime-local" },
      { name: "dueAt", label: "承诺截止时间", placeholder: "", inputType: "datetime-local" },
      { name: "successRule", label: "怎样算真正完成", placeholder: "例如：消息成功发出，不要求对方回复", minLength: 4 },
      { name: "evidenceRequirement", label: "完成时留下什么证据", placeholder: "例如：发送页面截图", minLength: 2 },
      { name: "rewardText", label: "完成后的奖励（可选）", placeholder: "例如：看一部喜欢的电影", optional: true },
      { name: "recoveryAction", label: "如果没完成，下一次更小的恢复动作", placeholder: "例如：只整理 3 个问题，次日中午前发出", minLength: 4 },
      { name: "witnessLabel", label: "见证人身份（可选，不写姓名）", placeholder: "例如：同寝室友", optional: true },
    ],
    nextState: "DAY_3_READY",
    nextDay: 3,
  },
  3: {
    day: 3,
    title: "让一个真人纠正你的想象。",
    objective: "获得一条无法只靠搜索得到的真人证据。",
    instructions: ["联系一位接近该方向的人。", "问他最近真正做过什么，而不是泛泛求建议。", "记录让你意外或不舒服的信息。"],
    completionCriteria: "提交真人身份背景、近期工作、困难、建议实验和意外发现。",
    evidenceKind: "DAY_3_HUMAN_CONTACT",
    fields: [
      { name: "contactRole", label: "我联系的人（只写身份，不写姓名）", placeholder: "例如：有两段产品实习经历的学长", minLength: 4 },
      { name: "outreachSent", label: "是否已真正发出联系", placeholder: "请选择", control: "select", options: [{ label: "是，已发出", value: "YES" }, { label: "还没有", value: "NO" }] },
      { name: "outreachCopy", label: "我实际发出的具体问题", placeholder: "记录问题，不必写对方姓名。", minLength: 8, control: "textarea" },
      { name: "replyState", label: "现在的回复状态", placeholder: "请选择", control: "select", options: [{ label: "收到回复", value: "REPLIED" }, { label: "暂未回复（也是证据）", value: "NO_REPLY" }] },
      { name: "replyFinding", label: "回复或未回复让我发现了什么", placeholder: "没有回复也可以记录渠道、问题或等待成本。", minLength: 8, control: "textarea" },
    ],
    nextState: "DAY_4_READY",
    nextDay: 4,
  },
  4: {
    day: 4,
    title: "做一次两小时微型工作实验 A。",
    objective: "用一个可见结果模拟这个方向的真实工作片段。",
    instructions: ["控制在两小时内。", "必须有明确结束条件。", "留下别人可以看到或检查的结果。"],
    completionCriteria: "提交实验方向、实际任务、可见产物和行动感受。",
    evidenceKind: "DAY_4_EXPERIMENT_A",
    fields: [
      { name: "direction", label: "实验 A 对应的方向", placeholder: "例如：产品", minLength: 2 },
      { name: "microTask", label: "我实际完成的两小时任务", placeholder: "写清开始、动作和结束条件。", minLength: 8, control: "textarea" },
      { name: "artifact", label: "留下的作品或可见结果", placeholder: "作品链接，或对产物的具体描述。", minLength: 4, control: "textarea" },
      { name: "artifactLink", label: "作品链接（可选）", placeholder: "https://…", optional: true },
      { name: "whatHappened", label: "行动中真正发生了什么", placeholder: "哪里投入、哪里卡住、最后完成到什么程度？", minLength: 8, control: "textarea" },
      { name: "focusScore", label: "过程专注程度", placeholder: "请选择", control: "select", options: scoreOptions },
      { name: "continueScore", label: "继续投入 10 小时的意愿", placeholder: "请选择", control: "select", options: scoreOptions },
    ],
    nextState: "DAY_5_READY",
    nextDay: 5,
  },
  5: {
    day: 5,
    title: "把作品交给一个真人。",
    objective: "用真实反馈检验作品价值，而不是只让自己或 AI 评价。",
    instructions: ["把任务 4 的结果发给一个真人。", "分别追问价值、看不懂之处和采用意愿。", "记录自己的真实反应。"],
    completionCriteria: "提交一份包含正向、负向和意外信息的真人反馈。",
    evidenceKind: "DAY_5_REAL_FEEDBACK",
    fields: [
      { name: "feedbackFrom", label: "我向谁请求了反馈（只写身份）", placeholder: "例如：校园社团负责人", minLength: 4 },
      { name: "feedbackRequested", label: "是否已真正发出反馈请求", placeholder: "请选择", control: "select", options: [{ label: "是，已发出", value: "YES" }, { label: "还没有", value: "NO" }] },
      { name: "feedbackState", label: "现在的反馈状态", placeholder: "请选择", control: "select", options: [{ label: "收到反馈", value: "RECEIVED" }, { label: "暂未回复（也是证据）", value: "NO_REPLY" }] },
      { name: "valuable", label: "对方认为有价值的地方；未回复可写“暂无”", placeholder: "尽量保留具体事实。", minLength: 2, control: "textarea" },
      { name: "unclear", label: "对方不认可的地方；未回复可记录等待与渠道", placeholder: "不要美化负反馈。", minLength: 4, control: "textarea" },
      { name: "wouldUse", label: "对方是否愿意继续使用、阅读或采用", placeholder: "请选择", control: "select", options: [
        { label: "愿意", value: "YES" },
        { label: "不愿意", value: "NO" },
        { label: "条件不足，无法判断", value: "UNSURE" },
      ] },
      { name: "unexpectedFeedback", label: "最意外的一条反馈", placeholder: "哪一点改变了你的判断？", minLength: 8, control: "textarea" },
      { name: "reaction", label: "我听到反馈后的真实反应", placeholder: "想继续、抗拒、兴奋，还是只想维护原来的想法？", minLength: 8, control: "textarea" },
    ],
    nextState: "DAY_6_READY",
    nextDay: 6,
  },
  6: {
    day: 6,
    title: "换一个明显不同的方向，做实验 B。",
    objective: "用对照实验判断自己喜欢的是身份想象，还是行动本身。",
    instructions: ["实验 B 必须与实验 A 明显不同。", "同样控制在两小时内并留下结果。", "最后比较两次行动状态。"],
    completionCriteria: "提交第二个微型作品、行动评分和与实验 A 的比较。",
    evidenceKind: "DAY_6_EXPERIMENT_B",
    fields: [
      { name: "direction", label: "实验 B 对应的不同方向", placeholder: "例如：内容创作", minLength: 2 },
      { name: "microTask", label: "我实际完成的两小时任务", placeholder: "写清开始、动作和结束条件。", minLength: 8, control: "textarea" },
      { name: "artifact", label: "留下的作品或可见结果", placeholder: "作品链接，或对产物的具体描述。", minLength: 4, control: "textarea" },
      { name: "artifactLink", label: "作品链接（可选）", placeholder: "https://…", optional: true },
      { name: "whatHappened", label: "行动中真正发生了什么", placeholder: "哪里投入、哪里卡住、最后完成到什么程度？", minLength: 8, control: "textarea" },
      { name: "focusScore", label: "过程专注程度", placeholder: "请选择", control: "select", options: scoreOptions },
      { name: "continueScore", label: "继续投入 10 小时的意愿", placeholder: "请选择", control: "select", options: scoreOptions },
      { name: "comparison", label: "和实验 A 相比，我发现了什么", placeholder: "比较行动状态，不比较方向名气。", minLength: 8, control: "textarea" },
    ],
    nextState: "DAY_7_READY",
    nextDay: 7,
  },
  7: {
    day: 7,
    title: "只做当前证据允许的判断。",
    objective: "形成第一张方向判断，并确定未来 14 天唯一值得继续的实验。",
    instructions: ["结论必须引用本轮真实证据。", "暂时排除不是永久放弃。", "证据不足可以保留，不要强行得到答案。"],
    completionCriteria: "提交继续方向、暂时排除方向、证据依据和下一轮实验。",
    evidenceKind: "DAY_7_DECISION",
    fields: [
      { name: "continueDirection", label: "值得继续验证的方向", placeholder: "写一个方向。", minLength: 2 },
      { name: "continueEvidence", label: "支持继续验证的证据", placeholder: "引用行动、作品或真人反馈。", minLength: 8, control: "textarea" },
      { name: "rejectedDirection", label: "暂时排除的方向", placeholder: "写一个当前不值得继续投入的方向。", minLength: 2 },
      { name: "rejectedEvidence", label: "支持暂时排除的证据", placeholder: "说明是哪条现实证据改变了判断。", minLength: 8, control: "textarea" },
      { name: "insufficientDirection", label: "仍然证据不足的方向（可选）", placeholder: "没有可以留空。", optional: true },
      { name: "insufficientReason", label: "为什么证据仍不足（可选）", placeholder: "还缺哪一种现实证据？", optional: true, control: "textarea" },
      { name: "nextExperiment", label: "未来 14 天唯一实验", placeholder: "写清行动、产物和现实反馈对象。", minLength: 12, control: "textarea" },
      { name: "successCriterion", label: "14 天后如何判断实验是否完成", placeholder: "必须是可以检查的结束条件。", minLength: 8, control: "textarea" },
    ],
    nextState: "ROUND_COMPLETE",
    nextDay: 7,
  },
};

export type TaskEvidenceValidation =
  | { complete: true; content: Record<string, string> }
  | { complete: false; message: string };

export function validateTaskEvidence(task: ExplorationTask, values: Record<string, string>): TaskEvidenceValidation {
  const content = Object.fromEntries(task.fields.map((field) => [field.name, (values[field.name] ?? "").trim().replace(/\s+/g, " ")]));
  const incomplete = task.fields.find((field) => {
    const value = content[field.name];
    if (field.optional && !value) return false;
    return !value || value.length < (field.minLength ?? 1);
  });
  if (incomplete) {
    return { complete: false, message: `请补充“${incomplete.label}”，让这条证据足够具体。` };
  }
  return { complete: true, content };
}

export function getExplorationTask(day: number) {
  return EXPLORATION_TASKS[day] ?? null;
}

export function isDifferentExperimentDirection(experimentA: string, experimentB: string) {
  const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, "");
  return normalize(experimentA) !== normalize(experimentB);
}
