// 服务端 Supabase 客户端 —— 在 Server Component / Route Handler 中使用
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // 在 Server Component 读取时无法写 cookie，忽略即可
          }
        },
      },
    }
  );
}

/** 管理端（service role），仅可在受信任的服务端代码中使用，绝不要暴露给浏览器 */
export function getServiceSupabase() {
  // 采用 createServerClient 的同样签名，但使用 Service Role Key
  const dummyCookieStore = {
    getAll: () => [] as { name: string; value: string }[],
    setAll: () => {},
  };
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: dummyCookieStore }
  );
}
