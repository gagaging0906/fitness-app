import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getServerSupabase, getServiceSupabase } from "@/lib/supabase/server";

/**
 * POST /api/generate-future-photo
 * Body: FormData(image, weeks, goal, gender)
 *
 * 使用通义万象 (wanx-v1) 文生图：
 * 1. 上传原图到 future-input（存档）
 * 2. 调用通义万象生成健身激励图（提交任务 → 轮询等结果）
 * 3. sharp 加水印 + 压缩
 * 4. 上传到 future-output，写 generated_photos 表
 * 5. 返回签名 URL
 *
 * 注：通义万象为文生图，不直接保留用户人脸，聚焦体型激励效果。
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const WATERMARK_SVG = (w: number, h: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <style>
    .wm { fill: rgba(255,255,255,0.75); font-family: "PingFang SC", sans-serif;
          font-size: ${Math.max(14, Math.floor(w / 30))}px; font-weight: 600;
          paint-order: stroke; stroke: rgba(0,0,0,0.35); stroke-width: 2px; }
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
  const file    = fd.get("image")  as File | null;
  const weeks   = Number(fd.get("weeks")  || 8);
  const goal    = String(fd.get("goal")   || "cut");
  const gender  = String(fd.get("gender") || "male");

  if (!file) return NextResponse.json({ error: "missing_image" }, { status: 400 });
  if (!["cut","bulk"].includes(goal))      return NextResponse.json({ error: "invalid_goal" },   { status: 400 });
  if (!["male","female"].includes(gender)) return NextResponse.json({ error: "invalid_gender" }, { status: 400 });
  if (weeks < 4 || weeks > 24)            return NextResponse.json({ error: "invalid_weeks" },  { status: 400 });

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

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "missing_DASHSCOPE_API_KEY" }, { status: 500 });

  try {
    const inputBuf = Buffer.from(await file.arrayBuffer());
    const admin = getServiceSupabase();
    const timestamp = Date.now();

    // 1) 存档原图
    const inPath = `${user.id}/${timestamp}-input.jpg`;
    const { error: inErr } = await admin.storage.from("future-input")
      .upload(inPath, inputBuf, { contentType: file.type || "image/jpeg", upsert: false });
    if (inErr) throw inErr;
    const { data: inSigned } = await admin.storage.from("future-input")
      .createSignedUrl(inPath, 7200);

    // 2) 提交通义万象生图任务
    const prompt = buildPrompt({ weeks, goal, gender });
    const submitRes = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify({
          model: "wanx-v1",
          input: { prompt },
          parameters: {
            style: "<photography>",
            size:  "768*1024",
            n:     1,
          },
        }),
      }
    );

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error("万象提交失败：" + errText.slice(0, 200));
    }

    const submitJson = await submitRes.json();
    const taskId: string = submitJson?.output?.task_id;
    if (!taskId) throw new Error("未获取到 task_id：" + JSON.stringify(submitJson).slice(0, 200));

    // 3) 轮询等待结果（最多 50s，每 3s 一次）
    let imageUrl: string | null = null;
    const pollUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    for (let i = 0; i < 17; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes  = await fetch(pollUrl, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      const pollJson = await pollRes.json();
      const status   = pollJson?.output?.task_status;

      if (status === "SUCCEEDED") {
        imageUrl = pollJson?.output?.results?.[0]?.url ?? null;
        break;
      }
      if (status === "FAILED") {
        throw new Error("万象生图失败：" + JSON.stringify(pollJson?.output?.message ?? "").slice(0, 200));
      }
      // PENDING / RUNNING → 继续等待
    }

    if (!imageUrl) throw new Error("生图超时，请稍后重试");

    // 4) 下载生成图 → sharp 加水印
    const imgRes = await fetch(imageUrl);
    const rawBuf = Buffer.from(await imgRes.arrayBuffer());

    const base = await sharp(rawBuf)
      .resize({ width: 1080, withoutEnlargement: true })
      .toBuffer();
    const meta = await sharp(base).metadata();
    const w = meta.width  || 1080;
    const h = meta.height || 1440;
    const watermarkedBuf = await sharp(base)
      .composite([{ input: Buffer.from(WATERMARK_SVG(w, h)) }])
      .jpeg({ quality: 85 })
      .toBuffer();

    // 5) 上传到 future-output，写表
    const outPath = `${user.id}/${timestamp}-after.jpg`;
    const { error: outErr } = await admin.storage.from("future-output")
      .upload(outPath, watermarkedBuf, { contentType: "image/jpeg" });
    if (outErr) throw outErr;
    const { data: outSigned } = await admin.storage.from("future-output")
      .createSignedUrl(outPath, 7200);

    await admin.from("generated_photos").insert({
      user_id:    user.id,
      kind:       "future_body",
      input_url:  inSigned?.signedUrl  || inPath,
      output_url: outSigned?.signedUrl || outPath,
      weeks,
      goal,
      gender,
      model:      "wanx-v1",
      cost_cents: 1,
      expires_at: new Date(Date.now() + 90 * 86400_000).toISOString(),
    });

    return NextResponse.json({
      before_url: inSigned?.signedUrl,
      after_url:  outSigned?.signedUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "generate_error" },
      { status: 500 }
    );
  }
}

function buildPrompt({ weeks, goal, gender }: { weeks: number; goal: string; gender: string }) {
  const gDesc   = gender === "male" ? "男性" : "女性";
  const goalDesc = goal === "cut"
    ? `经过 ${weeks} 周减脂训练，体脂明显下降，腹肌线条清晰，腰围收紧，整体线条流畅`
    : `经过 ${weeks} 周增肌训练，肌肉饱满有力，肩背宽厚，手臂线条分明，整体体型健壮`;
  return `一位${gDesc}健身运动员的全身正面标准照，${goalDesc}。
专业健身房摄影棚，自然肤色，运动服，专业摄影，写实风格，中性背景，健康积极，高清人像。`;
}
