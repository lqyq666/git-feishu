import { NextResponse, type NextRequest } from "next/server";
import { PRODUCT_EVENTS } from "@/lib/analytics/events";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { eventName?: string; properties?: Record<string, unknown> } | null;
  if (!body?.eventName || !PRODUCT_EVENTS.includes(body.eventName as never)) return NextResponse.json({ code: "INVALID_EVENT" }, { status: 400 });
  const supabase = await createSupabaseServerClient(); const user = (await supabase.auth.getUser()).data.user; if (!user) return NextResponse.json({ accepted: false }, { status: 202 });
  const exploration = (await supabase.from("explorations").select("id,is_test").eq("user_id", user.id).maybeSingle()).data;
  const result = await supabase.from("product_events").insert({ user_id: user.id, exploration_id: exploration?.id ?? null, event_name: body.eventName, properties: body.properties ?? {}, is_test: exploration?.is_test ?? false });
  return result.error ? NextResponse.json({ code: "EVENT_WRITE_FAILED" }, { status: 500 }) : NextResponse.json({ accepted: true });
}
