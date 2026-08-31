# vNext 自包含交接

## 产品状态

产品已从按年级/资料库式入口重构为匿名优先的 7 次现实探索：

```text
Landing → Task 1 → Desire Map → Paywall → Task 2 → Task 3
→ Task 4 → Task 5 → Task 6 → Task 7 → Report → Share
```

系统内部按 Task 1–7 推进，不按自然日判断失败。产品只根据用户提交的现实证据形成阶段判断，不输出职业命定结论。未完成进入恢复动作，不使用身份羞辱；产品不自动发布社交媒体。

## 关键实现位置

- Landing / Task 1：`src/app/page.tsx`、`src/components/day-one-workspace.tsx`
- 欲望地图 / paywall：`src/app/desire-map/page.tsx`、`paywall-actions.tsx`
- Task 2–7：`daily-task-page.tsx`、`daily-task-workspace.tsx`、`src/lib/exploration/tasks.ts`
- Progress / report：`src/app/progress/page.tsx`、`exploration-report.tsx`
- Commitment：`commitment-checkin.tsx`、`src/lib/commitments/domain.ts`
- Auth recovery：`account-recovery-form.tsx`、`src/lib/auth/email-otp.ts`
- Entitlement / payment：`src/lib/entitlements/`、`src/lib/payments/`、`src/app/api/payments/`
- Share：`share-actions.tsx`、`src/app/api/share-card/route.tsx`
- Analytics：`src/lib/analytics/`、`src/app/api/events/route.ts`
- Database：`supabase/migrations/0001`–`0005` 及对应 rollback。

## 数据库与权限

生产 project ref：`cizcckmbdlgjkqzhhjgs`。vNext 使用 profiles、explorations、desire_signals、exploration_tasks、evidence_items、commitments、entitlements、payment_records、product_events，并保留 evidence、direction_hypotheses 兼容旧数据。

所有业务表 RLS 已在线回读。任务顺序、paid guard、证据最低要求、Task 6 对照方向、锁定承诺和恢复链由数据库 enforce。Task 2 通过 `submit_task_two_with_commitment` 在同一事务写入任务、证据和承诺；`0005` 已在线应用并用回滚事务验证。

## 支付边界

已实现 provider interface、价格环境配置、checkout API、payment record、签名 webhook、幂等 paid transition、entitlement upsert、success/cancel 页面、非生产 test provider 与受限 test unlock。

唯一允许残留的外部阻塞是：没有真实支付商户 provider 和凭据。生产因此明确返回 `PAYMENT_PROVIDER_NOT_CONFIGURED`。接入时只需实现一个 `PaymentProvider`，配置 provider/merchant/webhook secrets，并用真实 sandbox 订单验证 checkout、签名回调、重复 webhook 和 entitlement；无需修改任务或 paywall 领域。

## 验证与恢复

详细 18 项线上场景、数据库回滚事务和清理证据见 `VNEXT_VERIFICATION.md`。数据库变更均有 rollback 文件；测试用户以 `is_test` 标记并在验收后删除。当前基线中不存在 E2E 测试残留。

## 继续工作规则

- 不修改飞书资源。
- 不重建或删除现有生产数据。
- 新数据库变更必须新增 migration 和 rollback。
- 生产验收数据必须标记测试并清理。
- 不把构建通过当作线上验收。
- 不加入自动发帖、失败羞辱、按年级分流、排行榜或内容知识库。
