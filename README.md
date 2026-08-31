# 大学生现实探索系统

一个面向迷茫大学生的可恢复现实探索系统。用户无需按年级分流或先注册，通过 Day 1–7 的“行动 → 证据 → 判断 → 再行动”循环形成当前方向判断，并可用邮箱验证码跨设备找回进度。

## 本地运行

1. 将 `.env.example` 复制为 `.env.local`。
2. 填入 Supabase Project URL 与浏览器可用的 publishable/legacy anon key。
3. 安装依赖并启动：

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 数据库

- 初始迁移：`supabase/migrations/0001_exploration.sql`
- 完整探索循环：`supabase/migrations/0002_complete_exploration_loop.sql`
- 手动回滚：`supabase/rollback/`

迁移创建 `profiles`、`explorations`、`evidence`、`direction_hypotheses`，为全部用户数据启用基于 `auth.uid()` 的 RLS，并阻止没有已提交证据的进度推进。

## 验证

```bash
npm run test:unit
npm run lint
npm run build
```

不要提交 `.env.local`、数据库密码或任何 secret/service-role key。
