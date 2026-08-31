# 现实探索

面向感到迷茫但愿意行动的大学生，把模糊可能性变成现实证据。产品不做职业测评，也不替用户决定未来；核心循环是“行动 → 证据 → 判断 → 再行动”。

## 产品流程

```text
Landing → Task 1 一步一问 → 欲望地图 → Paywall
→ Task 2 现实拆解与行动承诺 → Task 3 真人接触
→ Task 4 实验 A → Task 5 外部反馈 → Task 6 对照实验 B
→ Task 7 证据判断 → 报告与 14 天实验 → 用户主动分享
```

用户匿名开始，不收集年级、学校或专业。Task 1 免费；Task 2–7、完整报告和高级分享由服务端 entitlement 控制。邮箱验证码只用于可选的跨设备恢复，并保持原匿名用户 ID 和数据。

## 技术结构

- Next.js App Router、React、TypeScript
- Supabase Auth、Postgres、RLS 与 SECURITY DEFINER RPC
- Vercel 生产部署
- Vitest 单元测试
- 本地草稿 + Supabase 防抖自动保存及 revision 冲突处理
- 支付 provider adapter、checkout、webhook、payment record、entitlement

数据库迁移按顺序位于 `supabase/migrations/0001` 至 `0005`，对应回滚文件位于 `supabase/rollback/`。不要手工修改生产结构而不保留 migration。

## 本地运行

1. 将 `.env.example` 复制为 `.env.local`。
2. 填入 Supabase Project URL 与浏览器可用的 publishable/legacy anon key。
3. 安装依赖并启动：

```bash
npm install
npm run dev
```

## 验证

```bash
npm run test:unit
npm run lint
npm run typecheck
npm run build
git diff --check
```

生产地址：<https://git-feishu.vercel.app>

完整验收证据见 `docs/VNEXT_VERIFICATION.md`，继续开发所需状态见 `docs/VNEXT_HANDOFF.md`。不要提交 `.env.local`、数据库密码、service-role key 或测试用户数据。
