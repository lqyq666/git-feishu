# 当前架构

`exploration-web` 是一个独立的 Next.js App Router 应用。现有飞书 Wiki、Base 和公开表单不被应用代码读取或写入。

- 页面：Day 1 诊断、邮箱续接、进度页、Day 2 首个验证问题。
- 身份：Supabase Anonymous Sign-In 先创建会话；用户可在完成 Day 1 后通过邮箱身份绑定恢复同一账号。
- 数据：Supabase Postgres。`explorations` 是进度主记录；`evidence` 保存 Day 1 的三条欲望信号；`direction_hypotheses` 保存 Day 2 的第一个验证问题。
- 授权：数据库迁移中的 RLS 以 `auth.uid()` 隔离每位用户。

尚未配置 Supabase 项目、邮件回调 URL 或部署域名，因此当前代码尚未连接真实账户和数据库。
