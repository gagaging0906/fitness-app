import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { calcDailyTarget } from "@/lib/calc";

/**
 * GET /api/daily-target
 * 返回当前用户的 BMR/TDEE/目标 kcal & 宏量营养素
 */
export async function GET(_req: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "profile_not_found" }, { status: 404 });

  try {
    const result = calcDailyTarget(profile);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "calc_error" }, { status: 400 });
  }
}
