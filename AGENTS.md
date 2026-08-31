# 大学生现实探索系统｜应用层约束

## 产品原则

- 目标不是资料浏览，而是帮助学生完成一个可验证的现实动作。
- Day 1 只有在三条欲望信号都完整时才能完成；不能用一次点击绕过。
- Day 2–7 是同一轮探索的连续任务，不按年级分流，也不重复收集背景信息。
- 每一天只有在对应现实证据已经持久化后才能推进状态。
- 不把通用内容伪装为个性化建议，不承诺实时机会、薪资、录取或就业结果。

## 身份与数据

- 先匿名进入，草稿和已提交证据都写入 Supabase；邮箱只用于可选的跨设备续接。
- Supabase 是应用状态的唯一数据源；飞书现有表单仅保留为独立的过渡入口，不做浏览器端双写。
- 所有用户数据表都必须启用 RLS，并按 `auth.uid()` 隔离。
- 永远不要把 Supabase `service_role` 密钥放入客户端、示例环境文件或提交记录。

## 当前 MVP 范围

- 实现：匿名会话、邮箱身份绑定、Day 1–7 确定性任务、草稿恢复、证据提交、方向判断和下一轮实验。
- 暂不实现：飞书同步、推荐算法、实时机会、自动化、公开分享、管理员后台。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
