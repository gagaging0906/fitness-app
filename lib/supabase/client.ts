// 浏览器端 Supabase 客户端（仅在 'use client' 组件里使用）
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function getBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
