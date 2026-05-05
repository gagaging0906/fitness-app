import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase/server";

/**
 * POST /api/generate-future-photo
 * Body: FormData(image, weeks, goal, gender)
 * 步骤：
 *   1. 上传原图到 future-input（私有）
 *   2. 调用 Gemini 2.5 Flash Image（Nano Banana）生成"N 周后的我"
 *   3. 用 sharp 加水印 "AI 生成参考图 · 非承诺"
 *   4. 上传到 future-output（私有），写 generated_photos 行
 *   5. 返回签名 URL（2 小时）
 *
 * 安全：限频 14 天 1 次；必须勾选协议（前端已控）；
 * 成年人校验（暂依赖用户自述，后续可接人脸年龄检测）
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const WATERMARK_SVG = (w: number, h: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <style>
    .wm { fill: rgba(255,255,255,0.75); font-family: "PingFang SC", sans-serif;
          font-size: ${Math.max(14, Math.floor(w / 30))}px; font-weight: 600;
          paint-order: stroke; stroke: rgba(0,0,0,0.35);
          stroke-width: 2px; }
  </style>
  <text x="${w - 12}" y="${h - 12}" text-anchor="end" class="wm">
    AI 生成参考图 · 非真实承诺
  </text>
</svg>`;

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("image") as File | null;
  const weeks = Number(fd.get("weeks") || 8);
  const goal = String(fd.get("goal") || "cut");
  const gender = String(fd.get("gender") || "male");
  if (!file) return NextResponse.json({ error: "missing_image" }, { status: 400 });
  if (!["cut", "bulk"].includes(goal)) return NextResponse.json({ error: "invalid_goal" }, { status: 400 });
  if (!["male", "female"].includes(gender)) return NextResponse.json({ error: "invalid_gender" }, { status: 400 });
  if (weeks < 4 || weeks > 24) return NextResponse.json({ error: "invalid_weeks" }, { status: 400 });

  // 限频：14 天 1 次
  const { data: recent } = await supabase
    .from("generated_photos").select("created_at")
    .eq("user_id", user.id)
    .gt("created_at", new Date(Date.now() - 14 * 86400_000).toISOString())
    .limit(1);
  if (recent && recent.length > 0) {
    return NextResponse.json(
      { error: "rate_limited", message: "每 14 天限生成 1 次，请稍后再试" },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "missing_GEMINI_API_KEY" }, { status: 500 });

  try {
    const inputBuf = Buffer.from(await file.arrayBuffer());

    // 1) 上传原图到私有 bucket
    const timestamp = Date.now();
    const inPath = `${user.id}/${timestamp}-input.jpg`;
    const admin = getServiceSupabase();
    const { error: inErr } = await admin.storage.from("future-input")
      .upload(inPath, inputBuf, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (inErr) throw inErr;
    const { data: inSigned } = await admin.storage.from("future-input")
      .createSignedUrl(inPath, 7200); // 2h

    // 2) 调用 Gemini 图像生成
    const prompt = buildPrompt({ weeks, goal, gender });
    const geminiEndpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=" + apiKey;
    const r = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: file.type || "image/jpeg", data: inputBuf.toString("base64") } },
            ],
          },
        ],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error("AI 生成失败：" + errText.slice(0, 200));
    }
    const j = await r.json();
    const parts = j?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);
    if (!imgPart) throw new Error("AI 未返回图片");
    const rawBuf = Buffer.from(imgPart.inlineData.data, "base64");

    // 3) sharp 加水印 + 压缩到 1080px 宽
    const base = await sharp(rawBuf).resize({ width: 1080, withoutEnlargement: true }).toBuffer();
    const meta = await sharp(base).metadata();
    const w = meta.width || 1080;
    const h = meta.height || 1440;
    const watermarkedBuf = await sharp(base)
      .composite([{ input: Buffer.from(WATERMARK_SVG(w, h)) }])
      .jpeg({ quality: 85 })
      .toBuffer();

    // 4) 上传到 future-output，写表
    const outPath = `${user.id}/${timestamp}-after.jpg`;
    const { error: outErr } = await admin.storage.from("future-output")
      .upload(outPath, watermarkedBuf, { contentType: "image/jpeg" });
    if (outErr) throw outErr;
    const { data: outSigned } = await admin.storage.from("future-output")
      .createSignedUrl(outPath, 7200);

    await admin.from("generated_photos").insert({
      user_id: user.id,
      kind: "future_body",
      input_url: inSigned?.signedUrl || inPath,
      output_url: outSigned?.signedUrl || outPath,
      weeks,
      goal,
      gender,
      model: "gemini-2.5-flash-image-preview",
      cost_cents: 4, // 约 $0.039/image ≈ 0.28￥
      expires_at: new Date(Date.now() + 90 * 86400_000).toISOString(),
    });

    return NextResponse.json({
      before_url: inSigned?.signedUrl,
      after_url: outSigned?.signedUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "generate_error" },
      { status: 500 }
    );
  }
}

function buildPrompt({
  weeks, goal, gender,
}: { weeks: number; goal: string; gender: string }) {
  const goalDesc =
    goal === "cut"
      ? "体脂下降约 3-5%，腰围明显收紧，线条更清晰"
      : "肌肉量增加约 1-2kg，肩背更饱满、手臂和胸部线条更立体";
  const genderDesc = gender === "male" ? "男性" : "女性";
  return `请基于上传的这张${genderDesc}正面照片，生成一张同一个人在坚持规律训练和饮食 ${weeks} 周后的预览图。

目标效果：${goalDesc}。
要求：
- 保持原人物五官、发型、肤色不变，只改变身形
- 姿势、光线、背景尽量一致
- 风格写实、中性照明、适合作为激励海报
- 不添加文字或 logo
- 仅返回一张图片`;
}
