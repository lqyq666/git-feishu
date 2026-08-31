import { redirect } from "next/navigation";
export default function TestPaymentPage() { if (process.env.NODE_ENV === "production") redirect("/desire-map"); return <main className="shell narrow-shell"><p className="eyebrow">测试支付</p><h1>测试订单已创建。</h1><p className="lede">此页面仅在非生产环境出现，用于验证订单、签名回调、幂等权益和付费墙解锁。</p></main>; }
