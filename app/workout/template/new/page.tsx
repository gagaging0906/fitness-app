"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, X, ChevronDown } from "lucide-react";
import { EXERCISES, GROUPS } from "@/lib/exercises";
import type { TemplateCategory, TemplateSplit, TemplateExercise, TemplateDay } from "@/lib/supabase/types";

// ─── 常量 ──────────────────────────────────────────────────────

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "beginner",    label: "新手" },
  { value: "advanced",    label: "进阶" },
  { value: "fat_loss",    label: "减脂" },
  { value: "muscle_gain", label: "增肌" },
];

const SPLITS: { value: TemplateSplit; label: string }[] = [
  { value: "full_body", label: "全身训练" },
  { value: "2split",    label: "二分化" },
  { value: "3split",    label: "三分化" },
  { value: "4split",    label: "四分化" },
  { value: "5split",    label: "五分化" },
];

// ─── 主页面 ──────────────────────────────────────────────────

export default function TemplateNewPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("beginner");
  const [split, setSplit] = useState<TemplateSplit>("3split");
  const [days, setDays] = useState<TemplateDay[]>([
    { day: 1, name: "训练日 1", exercises: [] },
  ]);
  const [saving, setSaving] = useState(false);

  // 动作选择器状态
  const [pickerDay, setPickerDay] = useState<number | null>(null); // 正在添加动作的 day 索引
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerGroup, setPickerGroup] = useState("全部");

  // ── 天操作 ──────────────────────────────────────────────────

  function addDay() {
    const nextNum = days.length + 1;
    setDays((prev) => [...prev, { day: nextNum, name: `训练日 ${nextNum}`, exercises: [] }]);
  }

  function removeDay(di: number) {
    setDays((prev) => prev.filter((_, i) => i !== di).map((d, i) => ({ ...d, day: i + 1 })));
  }

  function updateDayName(di: number, val: string) {
    setDays((prev) => prev.map((d, i) => i === di ? { ...d, name: val } : d));
  }

  // ── 动作操作 ────────────────────────────────────────────────

  function addExercise(di: number, ex: { id: string; name: string; type: "strength" | "cardio" }) {
    const newEx: TemplateExercise =
      ex.type === "cardio"
        ? { id: ex.id, name: ex.name, type: "cardio", sets: 1, duration_min: 20 }
        : { id: ex.id, name: ex.name, type: "strength", sets: 3, reps: "10" };
    setDays((prev) =>
      prev.map((d, i) => i === di ? { ...d, exercises: [...d.exercises, newEx] } : d)
    );
    setPickerDay(null);
    setPickerQuery("");
  }

  function removeExercise(di: number, ei: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === di ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) } : d
      )
    );
  }

  function updateExercise(di: number, ei: number, key: keyof TemplateExercise, val: string | number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === di
          ? {
              ...d,
              exercises: d.exercises.map((e, j) =>
                j === ei ? { ...e, [key]: val } : e
              ),
            }
          : d
      )
    );
  }

  // ── 保存 ────────────────────────────────────────────────────

  async function save() {
    if (!name.trim()) { toast.error("请填写计划名称"); return; }
    if (days.every((d) => d.exercises.length === 0)) {
      toast.error("至少在一个训练日中添加动作");
      return;
    }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { error } = await supabase.from("templates").insert({
      user_id: user.id,
      name: name.trim(),
      level: category === "advanced" || category === "muscle_gain" ? "intermediate" : "beginner",
      category,
      split,
      items: { version: 2, days } as unknown as never,
    });

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("计划已保存");
    router.replace("/workout");
  }

  // ── 动作选择器过滤 ──────────────────────────────────────────

  const pickerResults = EXERCISES.filter((e) => {
    const q = pickerQuery.trim();
    const matchGroup = pickerGroup === "全部" || e.group === pickerGroup;
    const matchQuery = !q || e.name.includes(q) || e.id.includes(q);
    return matchGroup && matchQuery;
  });

  // ── 渲染 ────────────────────────────────────────────────────

  return (
    <>
      <Header title="创建训练计划" back />
      <main className="page-padding space-y-4 pb-24">

        {/* 基本信息 */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label>计划名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：我的五分化计划" />
            </div>
            <div className="space-y-1.5">
              <Label>分类</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      category === c.value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>分化方式</Label>
              <div className="flex flex-wrap gap-2">
                {SPLITS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSplit(s.value)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      split === s.value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 训练日列表 */}
        {days.map((day, di) => (
          <Card key={di}>
            <CardContent className="p-4 space-y-3">
              {/* 天名称 */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {day.day}
                </div>
                <Input
                  value={day.name}
                  onChange={(e) => updateDayName(di, e.target.value)}
                  className="flex-1 h-9"
                  placeholder={`第 ${day.day} 天名称，如：胸 + 三头`}
                />
                {days.length > 1 && (
                  <button onClick={() => removeDay(di)} className="text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 该天动作 */}
              {day.exercises.length > 0 && (
                <div className="space-y-2">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ex.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {ex.type === "cardio"
                            ? `有氧 · ${ex.duration_min ?? 20} 分钟`
                            : `力量 · ${ex.sets ?? 3} 组 × ${ex.reps ?? "10"} 次`}
                        </div>
                      </div>
                      {/* 快速调整组数/次数/时长 */}
                      {ex.type === "strength" ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input
                            type="number" min={1} max={10}
                            value={ex.sets ?? 3}
                            onChange={(e) => updateExercise(di, ei, "sets", Number(e.target.value))}
                            className="w-10 h-7 rounded border border-border text-center text-xs bg-background"
                          />
                          <span>组</span>
                          <input
                            type="text"
                            value={ex.reps ?? "10"}
                            onChange={(e) => updateExercise(di, ei, "reps", e.target.value)}
                            className="w-14 h-7 rounded border border-border text-center text-xs bg-background"
                            placeholder="8-10"
                          />
                          <span>次</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input
                            type="number" min={1} max={180}
                            value={ex.duration_min ?? 20}
                            onChange={(e) => updateExercise(di, ei, "duration_min", Number(e.target.value))}
                            className="w-12 h-7 rounded border border-border text-center text-xs bg-background"
                          />
                          <span>分钟</span>
                        </div>
                      )}
                      <button onClick={() => removeExercise(di, ei)} className="text-muted-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setPickerDay(di); setPickerQuery(""); setPickerGroup("全部"); }}
                className="w-full rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + 添加动作
              </button>
            </CardContent>
          </Card>
        ))}

        {/* 添加训练日 */}
        <Button variant="outline" size="lg" className="w-full" onClick={addDay}>
          <Plus className="h-4 w-4 mr-2" /> 添加训练日
        </Button>

        <Button size="lg" className="w-full" onClick={save} disabled={saving}>
          {saving ? "保存中…" : "保存计划"}
        </Button>
      </main>

      {/* 动作选择器弹层 */}
      {pickerDay !== null && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/40" onClick={() => setPickerDay(null)} />
          <div className="bg-background rounded-t-2xl shadow-xl flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="font-semibold">选择动作</span>
              <button onClick={() => setPickerDay(null)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="px-4 pb-2">
              <Input
                autoFocus
                placeholder="搜索动作…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
              />
            </div>
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {["全部", ...GROUPS].map((g) => (
                <button
                  key={g}
                  onClick={() => setPickerGroup(g)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    pickerGroup === g ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-6 divide-y">
              {pickerResults.map((ex) => (
                <button
                  key={ex.id}
                  className="w-full flex items-center justify-between py-3 text-left"
                  onClick={() => addExercise(pickerDay, ex)}
                >
                  <div>
                    <div className="text-sm font-medium">{ex.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ex.group} · {ex.type === "cardio" ? "有氧" : "力量"}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
              ))}
              {pickerResults.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">没有找到匹配的动作</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
