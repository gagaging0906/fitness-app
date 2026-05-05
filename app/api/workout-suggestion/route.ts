import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getProgression } from "@/lib/calc";

/**
 * POST /api/workout-suggestion
 * Body: { exerciseId: string }
 * 根据历史训练数据，建议下次该动作的重量与次数（渐进超负荷算法）
 */
interface WorkoutRow { date: string; sets: { exerciseId: string; weight: number; reps: number; rir: number }[] }

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { exerciseId } = await req.json();
  if (!exerciseId) return NextResponse.json({ error: "missing_exerciseId" }, { status: 400 });

  // 取近 3 次该动作的最后一组
  const { data: recent } = await supabase
    .from("workouts").select("date,sets")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(10);

  const lastSets: { weight: number; reps: number; rir: number }[] = [];
  let zeroRirStreak = 0;

  for (const w of (recent ?? []) as WorkoutRow[]) {
    const exSets = w.sets.filter((s) => s.exerciseId === exerciseId);
    if (exSets.length === 0) continue;
    const lastOfDay = exSets[exSets.length - 1];
    lastSets.push(lastOfDay);
    if (lastOfDay.rir === 0) zeroRirStreak += 1;
    else break;
    if (lastSets.length >= 3) break;
  }

  if (lastSets.length === 0) {
    return NextResponse.json({
      action: "start",
      weight: 0,
      reps: 10,
      rir: 2,
      note: "首次训练，建议从轻重量热身开始，保留 2-3 次。",
    });
  }

  const progression = getProgression(lastSets, exerciseId, zeroRirStreak);
  return NextResponse.json(progression);
}
