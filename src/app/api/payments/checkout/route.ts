import { NextResponse, type NextRequest } from "next/server";
import { FULL_PRODUCT_KEY } from "@/lib/entitlements/domain";
import { explorationPriceMinor, getPaymentProvider, PaymentProviderNotConfiguredError } from "@/lib/payments/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordCheckout } from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient(); const user = (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ code: "AUTH_REQUIRED", message: "会话已失效，请刷新后重试。" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { productKey?: string };
  if (body.productKey !== FULL_PRODUCT_KEY) return NextResponse.json({ code: "INVALID_PRODUCT" }, { status: 400 });
  try {
    const provider = getPaymentProvider(); const origin = new URL(request.url).origin;
    const amountMinor = explorationPriceMinor();
    const checkout = await provider.createCheckout({ userId: user.id, productKey: FULL_PRODUCT_KEY, amountMinor, currency: "CNY", successUrl: `${origin}/payment/success`, cancelUrl: `${origin}/payment/cancel` });
    await recordCheckout({ userId: user.id, provider: checkout.provider, orderId: checkout.orderId, amountMinor, checkoutUrl: checkout.checkoutUrl, isTest: checkout.isTest });
    return NextResponse.json({ checkoutUrl: `${checkout.checkoutUrl}?orderId=${encodeURIComponent(checkout.orderId)}` });
  } catch (error) {
    if (error instanceof PaymentProviderNotConfiguredError) return NextResponse.json({ code: error.code, message: error.message }, { status: 503 });
    return NextResponse.json({ code: "CHECKOUT_FAILED", message: "支付暂时不可用，请稍后重试。" }, { status: 502 });
  }
}
