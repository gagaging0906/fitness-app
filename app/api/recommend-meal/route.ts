import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { calcDailyTarget } from "@/lib/calc";

/**
 * POST /api/recommend-meal
 * Body: { slot: "breakfast"|"lunch"|"dinner"|"snack", prefer?: string }
 * 返回 AI 推荐的一餐（中餐为主），含食材 / 做法 / 宏量估算
 * 使用 DeepSeek 或 通义千问（Dashscope）
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { slot = "lunch", prefer = "" } = await req.json().catch(() => ({}));
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "profile_not_found" }, { status: 404 });

  const target = calcDailyTarget(profile);
  const slotShare: Record<string, number> = {
    breakfast: 0.25, lunch: 0.4, dinner: 0.3, snack: 0.1,
  };
  const slotKcal = Math.round(target.target_kcal * (slotShare[slot] ?? 0.3));

  const prompt = `你是专业营养师，请为健身用户推荐一餐。
用户：${profile.gender === "male" ? "男" : "女"}，${profile.age}岁，
${profile.height_cm}cm，${profile.weight_kg}kg，目标：${profile.goal}；
时段：${SLOT_LABEL[slot]}；
本餐目标热量：约 ${slotKcal} kcal；
蛋白质目标：约 ${Math.round(target.macros.protein_g * (slotShare[slot] ?? 0.3))} g。
偏好：${prefer || "中餐、食材常见、30 分钟内可做"}。

返回严格 JSON（不要多余文字）：
{
  "name": "菜名",
  "kcal": 总热量数字,
  "protein": 蛋白克数,
  "fat": 脂肪克数,
  "carb": 碳水克数,
  "ingredients": ["食材1 数量", "食材2 数量"],
  "steps": ["步骤1", "步骤2", "步骤3"]
}`;

  const dashscopeKey = process.env.DASHSCOPE_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  try {
    let text = "";
    if (dashscopeKey) {
      const r = await fetch(
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${dashscopeKey}`,
          },
          body: JSON.stringify({
            model: "qwen-plus",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            response_format: { type: "json_object" },
          }),
        }
      );
      const j = await r.json();
      text = j.choices?.[0]?.message?.content ?? "";
    } else if (deepseekKey) {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      const j = await r.json();
      text = j.choices?.[0]?.message?.content ?? "";
    } else {
      return NextResponse.json(
        { error: "missing_DASHSCOPE_API_KEY_or_DEEPSEEK_API_KEY" },
        { status: 500 }
      );
    }
    let meal: unknown;
    try { meal = JSON.parse(text); }
    catch {
      const m = text.match(/\{[\s\S]*\}/);
      meal = m ? JSON.parse(m[0]) : null;
    }
    return NextResponse.json({ meal, target_kcal: slotKcal });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "recommend_error" },
      { status: 500 }
    );
  }
}

const SLOT_LABEL: Record<string, string> = {
  breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐",
};
