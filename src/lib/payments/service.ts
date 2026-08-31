import "server-only";
import { FULL_PRODUCT_KEY } from "@/lib/entitlements/domain";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function recordCheckout(input: {
  userId: string;
  provider: string;
  orderId: string;
  amountMinor: number;
  checkoutUrl: string;
  isTest: boolean;
}) {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("payment_records")
    .upsert(
      {
        user_id: input.userId,
        product_key: FULL_PRODUCT_KEY,
        provider: input.provider,
        provider_order_id: input.orderId,
        amount_minor: input.amountMinor,
        currency: "CNY",
        status: "PENDING",
        checkout_url: input.checkoutUrl,
        is_test: input.isTest,
      },
      { onConflict: "provider,provider_order_id" },
    )
    .select("id")
    .single();
  if (result.error) throw result.error;
  return result.data;
}

export async function grantPaidEntitlement(input: {
  provider: string;
  orderId: string;
  eventId: string;
}) {
  const admin = createSupabaseAdminClient();
  const payment = await admin
    .from("payment_records")
    .select("id,user_id,product_key,status")
    .eq("provider", input.provider)
    .eq("provider_order_id", input.orderId)
    .single();
  if (payment.error) throw payment.error;
  const update = await admin
    .from("payment_records")
    .update({
      status: "PAID",
      provider_event_id: input.eventId,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.data.id)
    .eq("status", "PENDING")
    .select("id");
  if (update.error) throw update.error;
  const transitionedToPaid = (update.data?.length ?? 0) === 1;
  const grant = await admin
    .from("entitlements")
    .upsert(
      {
        user_id: payment.data.user_id,
        product_key: payment.data.product_key,
        access_level: "FULL_EXPLORATION",
        source: "payment",
        source_reference: `${input.provider}:${input.orderId}`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,product_key,source,source_reference" },
    );
  if (grant.error) throw grant.error;
  if (transitionedToPaid) {
    const eventWrite = await admin.from("product_events").insert([
      {
        user_id: payment.data.user_id,
        event_name: "checkout_completed",
        properties: {
          product_key: payment.data.product_key,
          provider: input.provider,
        },
      },
      {
        user_id: payment.data.user_id,
        event_name: "entitlement_granted",
        properties: {
          product_key: payment.data.product_key,
          source: "payment",
        },
      },
    ]);
    if (eventWrite.error) throw eventWrite.error;
  }
  return {
    userId: payment.data.user_id,
    alreadyPaid: !transitionedToPaid,
  };
}
