"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Timer, Dumbbell, ChevronDown, ChevronUp, X } from "lucide-react";
import { todayStr } from "@/lib/utils";
import { calcWorkoutBurn, totalVolume } from "@/lib/calc";
import { EXERCISES, GROUPS } from "@/lib/exercises";
import type { TemplateDays } from "@/lib/supabase/types";

interface StrengthSet { type: "strength"; weight: number; reps: number; rir: number }
interface CardioSet   { type: "cardio";   duration_min: number }
type SetEntry = StrengthSet | CardioSet;

interface ExEntry {
  id: string; name: string; exType: "strength" | "cardio";
  sets: SetEntry[]; collapsed: boolean;
}

function makeEntry(id: string, name: string, type: "strength" | "cardio"): ExEntry {
  const s: SetEntry = type === "cardio"
    ? { type: "cardio", duration_min: 20 }
    : { type: "strength", weight: 0, reps: 10, rir: 2 };
  return { id, name, exType: type, sets: [s], collapsed: false };
}

export default function WorkoutNewPage() {
  const router  = useRouter();
  const sp      = useSearchParams();
  const supabase = getBrowserSupabase();
  const tplId   = sp.get("tpl");
  const dayNum  = Number(sp.get("day") || "0");

  const [name, setName]           = useState("今日训练");
  const [exercises, setExercises] = useState<ExEntry[]>([]);
  const [saving, setSaving]       = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery]         = useState("");
  const [group, setGroup]         = useState("全部");

  useEffect(() => {
    if (!tplId) return;
    (async () => {
      const { data } = await supabase
        .from("templates").select("name,items").eq("id", tplId).maybeSingle();
      if (!data) return;
      const items = (data as { items?: unknown }).items as unknown as TemplateDays;
      if (items?.version !== 2) return;
      const day = dayNum > 0 ? items.days.find((d) => d.day === dayNum) : items.days[0];
      if (!day) return;
      setName(`${(data as { name?: string }).name} · ${day.name}`);
      setExercises(day.exercises.map((e) => makeEntry(e.id, e.name, e.type)));
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tplId, dayNum]);

  /* ── 操作 ─────────────────────────────────────────────────── */

  function addEx(ex: { id: string; name: string; type: "strength" | "cardio" }) {
    setExercises((p) => [...p, makeEntry(ex.id, ex.name, ex.type)]);
    setShowPicker(false); setQuery("");
  }
  function rmEx(i: number) { setExercises((p) => p.filter((_, j) => j !== i)); }
  function toggle(i: number) { setExercises((p) => p.map((e, j) => j === i ? { ...e, collapsed: !e.collapsed } : e)); }
  function addSet(i: number) {
    setExercises((p) => p.map((e, j) => {
      if (j !== i) return e;
      return { ...e, sets: [...e.sets, { ...e.sets[e.sets.length - 1] }] };
    }));
  }
  function rmSet(ei: number, si: number) {
    setExercises((p) => p.map((e, j) => {
      if (j !== ei) return e;
      const s = e.sets.filter((_, k) => k !== si);
      return { ...e, sets: s.length ? s : e.sets };
    }));
  }
  function upd(ei: number, si: number, k: string, v: number) {
    setExercises((p) => p.map((e, j) =>
      j !== ei ? e : { ...e, sets: e.sets.map((s, k2) => k2 !== si ? s : { ...s, [k]: v }) }
    ));
  }

  /* ── 保存 ─────────────────────────────────────────────────── */

  async function save() {
    if (!exercises.length) { toast.error("至少添加一个动作"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { data: prof } = await supabase
      .from("profiles").select("weight_kg").eq("user_id", user.id).maybeSingle();
    const wkg = Number((prof as { weight_kg?: number } | null)?.weight_kg ?? 70);

    const flatSets = exercises.flatMap((ex) =>
      ex.sets.map((s, si) => ({
        exercise_id: ex.id, name: ex.name, type: ex.exType, set_num: si + 1,
        ...(s.type === "strength"
          ? { weight: s.weight, reps: s.reps, rir: s.rir }
          : { duration_min: s.duration_min }),
      }))
    );
    const burnInput = exercises.map((ex) => ({
      id: ex.id, type: ex.exType,
      sets: ex.sets.map((s) => s.type === "cardio"
        ? { duration_min: s.duration_min }
        : { weight: s.weight, reps: s.reps }),
    }));
    const burn = calcWorkoutBurn(burnInput, wkg);
    const vol  = totalVolume(
      exercises.flatMap((ex) =>
        ex.sets.filter((s): s is StrengthSet => s.type === "strength")
               .map((s) => ({ weight: s.weight, reps: s.reps }))
      )
    );

    const { data: saved, error } = await supabase
      .from("workouts").insert({
        user_id: user.id, date: todayStr(), template_id: tplId ?? null,
        name, sets: flatSets, total_volume: vol, burn_kcal: burn,
      }).select("id").single();

    if (error) { toast.error(error.message); setSaving(false); return; }

    const { data: log } = await supabase
      .from("daily_logs").select("burn_kcal").eq("user_id", user.id).eq("date", todayStr()).maybeSingle();
    await supabase.from("daily_logs").upsert({
      user_id: user.id, date: todayStr(),
      burn_kcal: (Number((log as { burn_kcal?: number } | null)?.burn_kcal ?? 0)) + burn,
    });

    setSaving(false);
    toast.success(`已保存 · 消耗 ${burn} kcal`);
    router.replace(`/workout/${(saved as { id: string }).id}`);
  }

  /* ── 动作选择器过滤 ───────────────────────────────────────── */

  const filtered = EXERCISES.filter((e) => {
    const q = query.trim();
    return (group === "全部" || e.group === group) && (!q || e.name.includes(q) || e.id.includes(q));
  });

  /* ── 渲染 ─────────────────────────────────────────────────── */

  return (
    <>
      <Header title="记录训练" back right={
        <button onClick={save} disabled={saving}
          className="text-[#00E5FF] text-[14px] font-semibold px-2 py-1 disabled:opacity-50">
          {saving ? "保存…" : "保存"}
        </button>
      } />

      <main className="px-4 pb-36 pt-4 space-y-3">
        {/* 训练名 */}
        <Input value={name} onChange={(e) => setName(e.target.value)}
               className="font-semibold text-[15px]" placeholder="训练名称" />

        {/* 动作列表 */}
        {exercises.map((ex, ei) => (
          <div key={ei} className="rounded-2xl bg-[#0E1116] border border-white/8
                                   shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] overflow-hidden">
            {/* 标题栏 */}
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
              <div className="h-8 w-8 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
                {ex.exType === "cardio"
                  ? <Timer    className="h-4 w-4 text-[#00E5FF]" strokeWidth={1.75} />
                  : <Dumbbell className="h-4 w-4 text-[#00E5FF]" strokeWidth={1.75} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#F5F7FA] truncate">{ex.name}</p>
                <p className="text-[11px] text-[#5C6470]">
                  {ex.exType === "cardio" ? "有氧" : "力量"} · {ex.sets.length} 组
                </p>
              </div>
              <button onClick={() => toggle(ei)} className="p-1 text-[#5C6470] hover:text-[#A1A8B3]">
                {ex.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              <button onClick={() => rmEx(ei)} className="p-1 text-[#5C6470] hover:text-[#F87171]">
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            {!ex.collapsed && (
              <div className="px-4 pb-3.5 space-y-2 border-t border-white/6 pt-3">
                {/* 列标题 */}
                {ex.exType === "strength" ? (
                  <div className="grid grid-cols-[20px_1fr_1fr_56px_20px] gap-2 text-center">
                    {["组","重量","次数","RIR",""].map((h, i) => (
                      <span key={i} className="label-micro">{h}</span>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-[20px_1fr_20px] gap-2 text-center">
                    <span className="label-micro">组</span>
                    <span className="label-micro">时长（分钟）</span>
                    <span />
                  </div>
                )}

                {ex.sets.map((s, si) =>
                  s.type === "strength" ? (
                    <div key={si} className="grid grid-cols-[20px_1fr_1fr_56px_20px] gap-2 items-center">
                      <span className="font-display text-[12px] text-[#5C6470] text-center tabular-nums">{si + 1}</span>
                      <Num value={s.weight} step={2.5} onChange={(v) => upd(ei, si, "weight", v)} />
                      <Num value={s.reps}   step={1}   onChange={(v) => upd(ei, si, "reps",   v)} />
                      <div className="flex gap-1">
                        {[0,1,2,3].map((r) => (
                          <button key={r} onClick={() => upd(ei, si, "rir", r)}
                            className={`flex-1 h-9 rounded-lg text-[12px] font-display font-bold transition-colors ${
                              s.rir === r
                                ? "bg-[#00E5FF]/20 text-[#00E5FF]"
                                : "bg-white/4 text-[#5C6470] hover:bg-white/8"
                            }`}>
                            {r}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => rmSet(ei, si)} className="flex justify-center text-[#5C6470] hover:text-[#F87171]">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div key={si} className="grid grid-cols-[20px_1fr_20px] gap-2 items-center">
                      <span className="font-display text-[12px] text-[#5C6470] text-center">{si + 1}</span>
                      <Num value={(s as CardioSet).duration_min} step={5} min={1}
                           onChange={(v) => upd(ei, si, "duration_min", v)} />
                      <button onClick={() => rmSet(ei, si)} className="flex justify-center text-[#5C6470] hover:text-[#F87171]">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                )}

                <button onClick={() => addSet(ei)}
                  className="w-full mt-1 rounded-xl border border-dashed border-white/12 py-2
                             text-[12px] text-[#5C6470] hover:border-[#00E5FF]/40 hover:text-[#00E5FF] transition-colors">
                  + 添加一组
                </button>
              </div>
            )}
          </div>
        ))}

        <Button variant="outline" size="lg" className="w-full" onClick={() => setShowPicker(true)}>
          <Plus className="h-4 w-4" /> 添加动作
        </Button>
        <Button size="lg" className="w-full" onClick={save} disabled={saving}>
          {saving ? "保存中…" : "完成并保存"}
        </Button>
      </main>

      {/* 动作选择器底部弹层 */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/60" onClick={() => setShowPicker(false)} />
          <div className="bg-[#0E1116] rounded-t-[24px] border-t border-white/10 flex flex-col max-h-[78vh]
                          shadow-[0_-8px_32px_rgba(0,0,0,0.8)]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-9 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <span className="text-[16px] font-semibold text-[#F5F7FA]">选择动作</span>
              <button onClick={() => setShowPicker(false)} className="text-[#5C6470] hover:text-[#A1A8B3]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 pb-3">
              <Input autoFocus placeholder="搜索动作名称…" value={query}
                     onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {["全部", ...GROUPS].map((g) => (
                <button key={g} onClick={() => setGroup(g)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                    group === g ? "bg-[#00E5FF]/15 text-[#00E5FF]" : "bg-white/6 text-[#5C6470]"
                  }`}>
                  {g}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-8 divide-y divide-white/[0.05]">
              {filtered.map((ex) => (
                <button key={ex.id} onClick={() => addEx(ex)}
                  className="w-full flex items-center justify-between py-3.5 text-left">
                  <div>
                    <p className="text-[14px] font-medium text-[#F5F7FA]">{ex.name}</p>
                    <p className="text-[12px] text-[#5C6470]">
                      {ex.group} · {ex.type === "cardio" ? "有氧" : "力量"}
                    </p>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
                    <Plus className="h-3.5 w-3.5 text-[#00E5FF]" />
                  </div>
                </button>
              ))}
              {!filtered.length && (
                <p className="py-10 text-center text-[13px] text-[#3A4049]">没有找到匹配的动作</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Num({ value, onChange, step = 1, min = 0, max }: {
  value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number;
}) {
  return (
    <Input type="number" inputMode="decimal" step={step} min={min} max={max}
           value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
           className="h-10 text-center text-[14px] px-1 font-display" />
  );
}
