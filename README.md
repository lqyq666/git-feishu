# 大学生现实探索系统

一个可恢复的 Day 1 → Day 2 Web MVP。用户先匿名进入，完成三条欲望信号后进入 Day 2，并可用邮箱绑定当前账号以跨设备找回进度。

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

- 迁移：`supabase/migrations/0001_exploration.sql`
- 手动回滚：`supabase/rollback/0001_exploration_down.sql`

迁移创建 `profiles`、`explorations`、`evidence`、`direction_hypotheses`，并为全部用户数据启用基于 `auth.uid()` 的 RLS。

## 验证

```bash
npm run test:domain
npm run lint
npm run build
```

不要提交 `.env.local`、数据库密码或任何 secret/service-role key。
