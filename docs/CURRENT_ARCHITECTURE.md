# 当前架构

`exploration-web` 是一个独立的 Next.js App Router 应用。现有飞书 Wiki、Base 和公开表单不被应用代码读取或写入。

- 页面：Day 1 诊断、可选的邮箱备份、进度页、Day 2 首个验证问题。
- 身份：Supabase Anonymous Sign-In 自动创建会话，当前设备无需注册或登录；用户只在需要跨设备恢复时选择邮箱备份。
- 数据：Supabase Postgres。`explorations` 是进度主记录；`evidence` 保存 Day 1 的三条欲望信号；`direction_hypotheses` 保存 Day 2 的第一个验证问题。
- 授权：数据库迁移中的 RLS 以 `auth.uid()` 隔离每位用户。

Supabase 项目 `feishu`（ref：`cizcckmbdlgjkqzhhjgs`）已连接，四张应用表、RLS 与最小表级权限已在线回读。匿名登录、邮箱和手动身份绑定已配置；本地与生产回调地址均已加入允许列表。

生产地址为 `https://git-feishu.vercel.app`。本地和线上真实链路均已通过：匿名进入 → Day 1 三条信号 → Day 2-ready → 保存验证问题与现实动作 → 再次进入恢复内容。真实邮箱跨设备恢复与 CAPTCHA 仍待验收。
