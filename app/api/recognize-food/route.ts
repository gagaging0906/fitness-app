import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/recognize-food
 * Body: FormData(image)
 * 调用 Gemini 2.5 Flash 识别中餐，返回食物列表 & 估算热量
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "missing_GEMINI_API_KEY" }, { status: 500 });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    });

    const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
    const result = await model.generateContent([
      { text: PROMPT },
      { inlineData: { mimeType: file.type || "image/jpeg", data: bytes } },
    ]);

    const text = result.response.text().trim();
    let items: unknown;
    try {
      items = JSON.parse(text);
    } catch {
      // 抽取 JSON 数组片段兜底
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
