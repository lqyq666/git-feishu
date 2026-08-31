import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/progress";
  const redirectUrl = new URL(safeNext, request.url);
  if (!isSupabaseConfigured()) return NextResponse.redirect(redirectUrl);
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(redirectUrl);
}
