import { FULL_PRODUCT_KEY } from "@/lib/entitlements/domain";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
export type CheckoutRequest = { userId: string; productKey: typeof FULL_PRODUCT_KEY; amountMinor: number; currency: "CNY"; successUrl: string; cancelUrl: string };
export type CheckoutResult = { provider: string; orderId: string; checkoutUrl: string; isTest: boolean };
export interface PaymentProvider { name: string; createCheckout(input: CheckoutRequest): Promise<CheckoutResult>; verifyWebhook(payload: string, signature: string | null): Promise<{ eventId: string; orderId: string; paid: boolean }> }
export class PaymentProviderNotConfiguredError extends Error { code = "PAYMENT_PROVIDER_NOT_CONFIGURED" as const; constructor() { super("真实支付通道尚未配置。你可以继续体验免费任务，完整探索将在支付接入后开放。"); } }
export function explorationPriceMinor() { const value = Number(process.env.EXPLORATION_PRICE_MINOR ?? "9900"); return Number.isInteger(value) && value >= 0 ? value : 9900; }
class TestPaymentProvider implements PaymentProvider {
  name = "test";
  async createCheckout(input: CheckoutRequest) { return { provider: this.name, orderId: `test_${randomUUID()}`, checkoutUrl: `${new URL(input.successUrl).origin}/payment/test`, isTest: true }; }
  async verifyWebhook(payload: string, signature: string | null) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET; if (!secret || !signature) throw new Error("Missing signature");
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("Invalid signature");
    const event = JSON.parse(payload) as { eventId: string; orderId: string; paid: boolean }; return event;
  }
}
export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "test" && process.env.NODE_ENV !== "production") return new TestPaymentProvider();
  throw new PaymentProviderNotConfiguredError();
}
