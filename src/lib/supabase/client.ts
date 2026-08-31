"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, publishableKey } = getSupabasePublicConfig();
    browserClient = createBrowserClient(url, publishableKey);
  }
  return browserClient;
}
