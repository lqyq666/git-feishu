# 当前架构

`exploration-web` 是独立的 Next.js App Router 产品，不读取或写入飞书 Wiki、Doc、Base 或表单。

## 运行边界

- 浏览器：一步一问、草稿本地备份、交互验证、Web Share 与分享卡下载。
- Next.js Server：页面访问控制、支付 checkout/webhook、服务端 Supabase 会话。
- Supabase Auth：anonymous-first；邮箱 OTP 将匿名身份升级为可恢复身份。
- Supabase Postgres：探索、任务、证据、承诺、权限、支付与事件事实源。
- Vercel：生产部署与 GitHub main 分支持续部署。

## 数据模型

- `profiles`：匿名/已绑定身份资料，不保存学校、专业或年级。
- `explorations`：探索轮次及当前任务。
- `desire_signals`：ENVY、CURIOSITY、DISSATISFACTION 三类信号和 revision 草稿。
- `exploration_tasks`：Task 2–7 草稿、提交数据与状态。
- `evidence_items`：统一现实证据。
- `commitments`：行动规则、锁定状态、完成/未完成与恢复链。
- `entitlements`：`FREE` / `FULL_EXPLORATION` 权限事实。
- `payment_records`：provider 订单、事件和支付状态。
- `product_events`：北极星漏斗事件。
- `evidence`、`direction_hypotheses`：兼容既有用户数据的旧模型。

所有用户业务表启用 RLS。用户只读自己的数据；任务推进、证据写入、承诺结算和 Task 2 原子提交通过服务端验证 RPC 完成。service-role 只允许出现在服务端支付路径。

## 状态与权限

- Task 1 免费且无需登录表单。
- Task 2–7 的读取和 mutation 均要求有效 `exploration_full_v1` entitlement。
- 当前任务只能在前置任务完成后提交。
- Task 3/5 的完成依据是已经发出真实请求，不依赖对方回复。
- Task 4/6 需要实验输出；Task 6 的方向必须不同于实验 A。
- 承诺锁定后关键规则由数据库触发器保护；到期后用户如实结算，未完成会创建恢复承诺。

## 数据版本

- `0001_exploration.sql`：匿名探索基础。
- `0002_complete_exploration_loop.sql`：旧 Day 1–7 连续流程。
- `0003_exploration_vnext.sql`：vNext 任务、证据、承诺、权限、支付、事件与兼容迁移。
- `0004_harden_vnext_read_policies.sql`：收紧任务与证据写权限。
- `0005_atomic_task_two_commitment.sql`：Task 2、证据和主承诺的原子幂等提交。

生产 Supabase 项目 ref 为 `cizcckmbdlgjkqzhhjgs`。生产 URL 为 <https://git-feishu.vercel.app>。验证日期、数据库回读与线上场景见 `VNEXT_VERIFICATION.md`。
