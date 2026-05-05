import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { fmt } from "@/lib/utils";
import { Dumbbell, Timer } from "lucide-react";

interface SetRow {
  name?: string;
  exercise_id?: string;
  exerciseId?: string;
  type?: "strength" | "cardio";
  set_num?: number;
  weight?: number;
  reps?: number;
  rir?: number;
  duration_min?: number;
}

export default async function WorkoutDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: w } = await supabase
    .from("workouts").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!w) redirect("/workout");

  const rawSets = (w as { sets?: SetRow[] }).sets as SetRow[] ?? [];

  // 按动作分组
  const exerciseMap = new Map<string, { name: string; type: string; sets: SetRow[] }>();
  for (const s of rawSets) {
    const key = s.exercise_id ?? s.exerciseId ?? s.name ?? "unknown";
    const display = s.name ?? s.exerciseId ?? s.exercise_id ?? key;
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, { name: display, type: s.type ?? "strength", sets: [] });
    }
    exerciseMap.get(key)!.sets.push(s);
  }
  const exercises = Array.from(exerciseMap.values());

  const strengthSets = rawSets.filter((s) => s.type !== "cardio" || !s.type);
  const cardioSets   = rawSets.filter((s) => s.type === "cardio");
  const totalDuration = cardioSets.reduce((sum, s) => sum + (s.duration_min ?? 0), 0);

  return (
    <>
      <Header title="" back />

      <main className="px-4 pb-32 space-y-5">
        {/* Hero 报告区 */}
        <div className="pt-4 space-y-1">
          <p className="label-micro">WORKOUT REPORT · {(w as { date?: string }).date}</p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#F5F7FA] leading-tight">
            {(w as { name?: string }).name}
          </h1>
        </div>

        {/* 三列超大数据 */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0E1116] border border-white/8
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24"
               style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,229,255,0.08) 0%, transparent 65%)" }} />
          <div className="relative grid grid-cols-3 divide-x divide-white/6 text-center py-5 px-2">
            <HeroStat label="总组数"  value={String(strengthSets.length)} unit="SETS" />
            <HeroStat label="总吨位"  value={fmt(Number((w as { total_volume?: number }).total_volume))} unit="KG" />
            <HeroStat label="消耗"    value={fmt(Number((w as { burn_kcal?: number }).burn_kcal))}   unit="KCAL" accent />
          </div>
        </div>

        {/* 有氧时长（若有） */}
        {totalDuration > 0 && (
          <div className="rounded-2xl bg-[#0E1116] border border-white/8
                          shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] px-5 py-4
                          flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
              <Timer className="h-4 w-4 text-[#00E5FF]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="label-micro">有氧训练</p>
              <p className="font-display text-[20px] font-bold tabular-nums text-[#F5F7FA] mt-0.5">
                {totalDuration} <span className="text-[13px] font-normal text-[#5C6470]">分钟</span>
              </p>
            </div>
          </div>
        )}

        {/* 动作明细 */}
        <div className="space-y-2">
          {exercises.map((ex, i) => (
            <div key={i}
              className="rounded-2xl bg-[#0E1116] border border-white/8
                         shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden">
              {/* 动作标题 */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
                <div className="h-8 w-8 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
                  {ex.type === "cardio"
                    ? <Timer   className="h-4 w-4 text-[#00E5FF]" strokeWidth={1.75} />
                    : <Dumbbell className="h-4 w-4 text-[#00E5FF]" strokeWidth={1.75} />}
                </div>
                <span className="flex-1 text-[14px] font-semibold text-[#F5F7FA] truncate">{ex.name}</span>
                <span className="text-[11px] font-medium uppercase tracking-wide
                                 bg-[#00E5FF]/10 text-[#00E5FF] rounded-full px-2.5 py-0.5">
                  {ex.sets.length} SETS
                </span>
              </div>

              {/* 组列表 */}
              <div className="divide-y divide-white/[0.04]">
                {ex.type === "cardio"
                  ? ex.sets.map((s, si) => (
                      <div key={si} className="grid grid-cols-[24px_1fr] gap-3 px-4 py-2.5 items-center">
                        <span className="font-display text-[12px] text-[#5C6470] text-center">{si + 1}</span>
                        <span className="font-display text-[15px] font-semibold tabular-nums text-[#F5F7FA]">
                          {s.duration_min ?? 0}
                          <span className="text-[12px] font-normal text-[#5C6470] ml-1">分钟</span>
                        </span>
                      </div>
                    ))
                  : (
                    <>
                      {/* 表头 */}
                      <div className="grid grid-cols-[24px_1fr_1fr_48px] gap-3 px-4 py-1.5">
                        {["组","重量","次数","RIR"].map((h) => (
                          <span key={h} className="label-micro text-center">{h}</span>
                        ))}
                      </div>
                      {ex.sets.map((s, si) => (
                        <div key={si} className="grid grid-cols-[24px_1fr_1fr_48px] gap-3 px-4 py-2.5 items-center">
                          <span className="font-display text-[12px] text-[#5C6470] text-center tabular-nums">{si + 1}</span>
                          <span className="font-display text-[15px] font-semibold tabular-nums text-center text-[#F5F7FA]">
                            {s.weight ?? 0}<span className="text-[11px] text-[#5C6470]">kg</span>
                          </span>
                          <span className="font-display text-[15px] font-semibold tabular-nums text-center text-[#F5F7FA]">
                            {s.reps ?? 0}<span className="text-[11px] text-[#5C6470]">次</span>
                          </span>
                          <span className="font-display text-[13px] tabular-nums text-center text-[#5C6470]">
                            {s.rir ?? 0}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

function HeroStat({ label, value, unit, accent }: {
  label: string; value: string; unit: string; accent?: boolean;
}) {
  return (
    <div className="px-2">
      <p className="label-micro">{label}</p>
      <p className="font-display mt-1.5 leading-none tabular-nums"
         style={{ fontSize: "clamp(24px,7vw,36px)", fontWeight: 700, letterSpacing: "-0.02em",
                  color: accent ? "#00E5FF" : "#F5F7FA" }}>
        {value}
      </p>
      <p className="label-micro mt-1">{unit}</p>
    </div>
  );
}
