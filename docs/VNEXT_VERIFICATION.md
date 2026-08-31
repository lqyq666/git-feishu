# vNext 验收证据

验收日期：2026-08-31。环境：Vercel production `https://git-feishu.vercel.app`，Supabase production `cizcckmbdlgjkqzhhjgs`。

## 线上关键路径

| # | 场景 | 证据与结果 |
|---|---|---|
| 1 | anonymous-first Landing | 新浏览器会话自动获得匿名用户；首页没有年级、学校、专业、邮箱前置字段。PASS |
| 2 | Task 1 一步一问 | 依次完成 ENVY、CURIOSITY、DISSATISFACTION；单屏一个主要问题并显示进度。PASS |
| 3 | Task 1 草稿恢复 | 输入中本地与云端保存；刷新后内容和当前问题恢复。相同 revision 恢复 wizard 位置的回归测试已加入。PASS |
| 4 | 欲望地图 | 三条信号完成后生成地图，并明确“假设，不是人生结论”。PASS |
| 5 | 免费/付费边界 | 欲望地图之后出现 paywall；无 entitlement 不能进入或提交 Task 2–7。PASS |
| 6 | 未配置真实支付 | Checkout 返回 `PAYMENT_PROVIDER_NOT_CONFIGURED` 和可理解提示，不伪造生产 provider。PASS（真实商户联调未执行） |
| 7 | 测试 entitlement | 标记 `is_test=true` 的线上匿名用户获得 test entitlement 后可进入 Task 2；非测试用户不能使用测试解锁。PASS |
| 8 | Task 2 承诺 | 现实问题、If-Then 行动、成功规则、证据、奖励、恢复动作及模式均可提交。PASS |
| 9 | Task 3 无回复 | 提交 OUTREACH_SENT 并记录 `NO_REPLY` 后合法推进。PASS |
| 10 | Task 4 实验 A | 真实任务与 EXPERIMENT_OUTPUT 证据提交成功。PASS |
| 11 | Task 5 无回复 | 已发出反馈请求、暂无回复仍可合法推进。PASS |
| 12 | Task 6 对照规则 | 与实验 A 相同方向被 UI 与数据库拒绝；更换方向后通过。PASS |
| 13 | Task 7 与报告 | 生成 7 任务、证据统计、A/B 对照、四类阶段判断、停止纠结、3 个 14 天实验及身份总结。PASS |
| 14 | 分享 | 分享卡返回 PNG，实测 1200×1500、61,297 bytes；不含邮箱、用户 ID、姓名或内部路径。Web Share/复制/下载均由用户触发。PASS |
| 15 | Mobile | 390×844 对欲望地图、paywall、分享执行视觉与交互检查；无横向溢出，错误提示对比度修复。PASS |
| 16 | 老用户兼容 | 两名已有用户的信号、旧 evidence 和当前 Task 2 可继续访问，并获得 migration entitlement。PASS |
| 17 | 完整线上 E2E | 测试前缀 `E2E-FULL-3ab7aed-` 从 Task 1 完成至报告；审计为 7 completed tasks、7 evidence、1 commitment。PASS |
| 18 | E2E 清理 | 删除完整测试 auth user 后级联回读：test explorations/events/signals 均为 0。PASS |

## 数据库事务与安全验证

- 11 张业务表逐表回读，RLS 均为 `true`。
- `explorations` 仅允许 own select/insert；`exploration_tasks`、`evidence_items` 为 select-only，写入经 RPC。
- 两名旧用户数据基线保留：explorations 2、legacy evidence 8、desire signals 6、tasks 14、migration entitlements 2。
- 锁定承诺修改 `success_rule` 的回滚事务返回 `LOCKED_RULE_MUTATION_BLOCKED`。
- 逾期承诺结算回滚事务证明原承诺进入 `RECOVERY_ACTIVE`，且只生成一个 replacement `ACTIVE` 承诺。
- Task 2 原子提交最初暴露 `integer`/`smallint` 签名错误；已将调用改为 `2::smallint` 并在线重建函数。修复后回滚事务返回 `ATOMIC_TASK_TWO_IDEMPOTENCY_VERIFIED_AND_ROLLED_BACK`，两次调用得到同一 task id、一个主承诺，且无持久数据变化。
- `0005` 唯一部分索引保证每个 task 只有一个非 recovery 主承诺。

## 测试覆盖映射

- Unit：Task 1 三信号、旧数据兼容、draft 冲突、Task 2–7 定义、证据验证、Task 6 方向、entitlement 生效/过期、commitment lock/overdue/recovery、email OTP 流程、支付 provider 边界、分享隐私与反羞辱。
- Online integration：anonymous persistence、draft upsert/reload、RLS ownership、entitlement、Task 2 原子提交、commitment recovery、旧用户迁移。
- Online E2E：上表 18 项关键场景，其中完整主路径覆盖任务书要求的 12 个 E2E 类别。

最终提交必须再次运行 `test:unit`、`lint`、`typecheck`、`build` 和 `git diff --check`；最终部署提交号与检查结果记录在 `VNEXT_HANDOFF.md`。
