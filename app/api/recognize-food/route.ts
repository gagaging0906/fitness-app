import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/recognize-food
 * Body: FormData(image)
 * 使用通义千问 VL (qwen-vl-max) 识别中餐，返回食物列表 & 估算热量
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const PROMPT = `你是一位专业的营养师。请识别这张图片里的所有食物（中餐为主），
按下面 JSON 数组返回（只返回 JSON，不要任何额外文字）：

[
  {
    "name": "食物中文名",
    "qty": "份量描述，如 1 碗 / 100g / 1 份",
    "kcal": 估算总热量,
    "protein": 蛋白质克数,
    "fat": 脂肪克数,
    "carb": 碳水克数
  }
]

要求：
- 用通用估算份量，精度到个位；热量范围 0-2000；蛋白/脂/碳水范围 0-200
- 若图片中看不到食物，返回 []
- 不要解释，只输出 JSON 数组`;

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "missing_image" }, { status: 400 });

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "missing_DASHSCOPE_API_KEY" }, { status: 500 });

  try {
    const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${bytes}`;

    const r = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: dataUrl } },
                { type: "text", text: PROMPT },
              ],
            },
          ],
          temperature: 0.2,
        }),
      }
    );

    if (!r.ok) {
      const errText = await r.text();
      throw new Error("通义识图失败：" + errText.slice(0, 200));
    }

    const j = await r.json();
    const text = (j.choices?.[0]?.message?.content ?? "").trim();

    let items: unknown;
    try {
      items = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      items = match ? JSON.parse(match[0]) : [];
    }

    return NextResponse.json({ items: Array.isArray(items) ? items : [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "recognize_error" },
      { status: 500 }
    );
  }
}
