import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * 中间件：刷新 Supabase 会话 cookie
 * 这样 Server Component 能拿到最新的登录态
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );

  // 仅仅调用一下 getUser() 就会顺带刷新 cookie
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: [
    // 跳过 _next/static、_next/image、favicon、API 以外的所有路径都执行中间件
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
