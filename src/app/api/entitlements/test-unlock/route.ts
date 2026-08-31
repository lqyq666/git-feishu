import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FULL_PRODUCT_KEY } from "@/lib/entitlements/domain";
export async function POST() {
  if (process.env.ENABLE_TEST_UNLOCK !== "true") return NextResponse.json({ code: "TEST_UNLOCK_DISABLED" }, { status: 404 });
  const supabase = await createSupabaseServerClient(); const user = (await supabase.auth.getUser()).data.user; if (!user) return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });
  const exploration = await supabase.from("explorations").select("id,is_test").eq("user_id", user.id).single(); if (exploration.error || !exploration.data.is_test) return NextResponse.json({ code: "TEST_EXPLORATION_REQUIRED" }, { status: 403 });
  const admin = createSupabaseAdminClient(); const grant = await admin.from("entitlements").upsert({ user_id: user.id, product_key: FULL_PRODUCT_KEY, access_level: "FULL_EXPLORATION", source: "test", source_reference: exploration.data.id }, { onConflict: "user_id,product_key,source,source_reference" });
  if (grant.error) return NextResponse.json({ code: "GRANT_FAILED" }, { status: 500 }); return NextResponse.json({ granted: true });
}
