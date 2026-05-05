import { NextResponse } from "next/server";

/**
 * GET /api/daily-quote
 * 返回每日一句激励文案（可以接通义/DeepSeek 生成，这里先给本地池）
 */
const POOL = [
  "每天只要进步 1%，一年就是 37 倍的自己。",
  "身体不会说谎，坚持会给你最好的回答。",
  "今天你对训练敷衍，明天身体就对你敷衍。",
  "你流过的汗，最终会变成光。",
  "自律给的自由，才是真正的自由。",
  "不是所有人都看得见你的努力，但镜子可以。",
  "一次不练找借口，十次不练成借口体质。",
  "慢就慢，别停。",
  "把每一次训练当成给未来的自己存款。",
  "吃够蛋白、睡够八小时，是最好的增肌药。",
];

export async function GET() {
  const text = POOL[Math.floor(Math.random() * POOL.length)];
  return NextResponse.json({ text });
}
