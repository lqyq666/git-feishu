import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider, PaymentProviderNotConfiguredError } from "@/lib/payments/domain";
import { grantPaidEntitlement } from "@/lib/payments/service";
export async function POST(request: NextRequest) {
  try { const provider = getPaymentProvider(); const event = await provider.verifyWebhook(await request.text(), request.headers.get("x-payment-signature")); if (event.paid) await grantPaidEntitlement({ provider: provider.name, orderId: event.orderId, eventId: event.eventId }); return NextResponse.json({ received: true, eventId: event.eventId }); }
  catch (error) { if (error instanceof PaymentProviderNotConfiguredError) return NextResponse.json({ code: error.code }, { status: 503 }); return NextResponse.json({ code: "INVALID_WEBHOOK" }, { status: 400 }); }
}
