# 当前架构

`exploration-web` 是一个独立的 Next.js App Router 应用。现有飞书 Wiki、Base 和公开表单不被应用代码读取或写入。

- 页面：Day 1 欲望信号、Day 2–7 确定性现实任务、可选邮箱备份、动态进度页和本轮探索报告。
- 身份：Supabase Anonymous Sign-In 自动创建会话，当前设备无需注册或登录；用户只在需要跨设备恢复时选择邮箱备份。
- 数据：Supabase Postgres。`explorations` 是进度主记录；`evidence` 同时保存草稿和 Day 1–7 已提交证据；`direction_hypotheses` 保存 Day 2 形成的验证问题。数据库触发器阻止缺少已提交证据的状态推进。
- 授权：数据库迁移中的 RLS 以 `auth.uid()` 隔离每位用户。

Supabase 项目 `feishu`（ref：`cizcckmbdlgjkqzhhjgs`）已连接，四张应用表、RLS 与最小表级权限已在线回读。匿名登录、邮箱和手动身份绑定已配置；本地与生产回调地址均已加入允许列表。

生产地址为 `https://git-feishu.vercel.app`。Day 1–7 前端正在部署验证；数据库 `0002_complete_exploration_loop.sql` 已执行并回读。真实邮箱跨设备恢复、完整 Day 1–7 生产数据回归与 CAPTCHA 仍待验收。
