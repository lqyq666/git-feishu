# 当前架构

`exploration-web` 是一个独立的 Next.js App Router 应用。现有飞书 Wiki、Base 和公开表单不被应用代码读取或写入。

- 页面：Day 1 诊断、邮箱续接、进度页、Day 2 首个验证问题。
- 身份：Supabase Anonymous Sign-In 先创建会话；用户可在完成 Day 1 后通过邮箱身份绑定恢复同一账号。
- 数据：Supabase Postgres。`explorations` 是进度主记录；`evidence` 保存 Day 1 的三条欲望信号；`direction_hypotheses` 保存 Day 2 的第一个验证问题。
- 授权：数据库迁移中的 RLS 以 `auth.uid()` 隔离每位用户。

Supabase 项目 `feishu`（ref：`cizcckmbdlgjkqzhhjgs`）已连接，四张应用表、RLS 与最小表级权限已在线回读。匿名登录、邮箱、手动身份绑定和 `http://localhost:3000/auth/callback` 已配置。

本地真实链路已经通过：匿名进入 → Day 1 三条信号 → Day 2-ready → 保存验证问题与现实动作 → 再次进入恢复内容。尚未部署正式域名，因此邮箱跨设备回调仍需在部署后验收。
