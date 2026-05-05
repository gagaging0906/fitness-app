"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { calcDailyTarget, detectGoal } from "@/lib/calc";
import { fmt } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [form, setForm] = useState({
    nickname: "",
    gender: "male" as "male" | "female",
    age: 25,
    height_cm: 170,
    weight_kg: 70,
    weight_target_kg: 65,
    activity: "light" as "sedentary" | "light" | "moderate" | "active" | "very_active",
  });
  const [saving, setSaving] = useState(false);

  const goal = detectGoal(form.weight_kg, form.weight_target_kg);
  let preview: ReturnType<typeof calcDailyTarget> | null = null;
  try {
    preview = calcDailyTarget({
      gender: form.gender,
      age: form.age,
      height: form.height_cm,
      weight: form.weight_kg,
      weight_target: form.weight_target_kg,
      activity: form.activity,
    });
  } catch { preview = null; }

  function upd<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit() {
    if (!preview) { toast.error("请检查输入的数据是否在合理范围"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      nickname: form.nickname || null,
      gender: form.gender,
      age: form.age,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      weight_target_kg: form.weight_target_kg,
      activity: form.activity,
      goal,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("档案已保存");
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64"
           style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,229,255,0.08) 0%, transparent 60%)" }} />

      <div className="relative page-padding space-y-4">
        {/* 标题 */}
        <div className="pt-4 space-y-1">
          <p className="label-micro">STEP 1 / 1</p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#F5F7FA]">建立你的档案</h1>
          <p className="text-[13px] text-[#5C6470]">两分钟完成设置，解锁专属计划</p>
        </div>

        {/* 表单卡片 */}
        <div className="rounded-2xl bg-[#0E1116] border border-white/8
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5 space-y-4">
          <Field label="昵称（可选）">
            <Input value={form.nickname} onChange={(e) => upd("nickname", e.target.value)}
                   placeholder="如何称呼你" maxLength={20} />
          </Field>

          {/* 性别 Pill */}
          <div className="space-y-2">
            <label className="label-micro pl-0.5">性别</label>
            <div className="flex gap-2">
              {([["male","男"],["female","女"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => upd("gender", v)}
                  className={`flex-1 h-11 rounded-xl text-[14px] font-medium transition-all ${
                    form.gender === v
                      ? "bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40"
                      : "bg-white/4 text-[#A1A8B3] border border-white/8 hover:bg-white/6"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* 数字三列 */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="年龄">
              <Input type="number" inputMode="numeric" min={14} max={80}
                     value={form.age} onChange={(e) => upd("age", Number(e.target.value) || 0)} />
            </Field>
            <Field label="身高 cm">
              <Input type="number" inputMode="decimal" min={120} max={220}
                     value={form.height_cm} onChange={(e) => upd("height_cm", Number(e.target.value) || 0)} />
            </Field>
            <Field label="体重 kg">
              <Input type="number" inputMode="decimal" min={30} max={200} step="0.1"
                     value={form.weight_kg} onChange={(e) => upd("weight_kg", Number(e.target.value) || 0)} />
            </Field>
          </div>

          <Field label="目标体重 kg">
            <Input type="number" inputMode="decimal" min={30} max={200} step="0.1"
                   value={form.weight_target_kg} onChange={(e) => upd("weight_target_kg", Number(e.target.value) || 0)} />
          </Field>

          <Field label="日常活动强度">
            <Select value={form.activity}
              onChange={(e) => upd("activity", e.target.value as typeof form.activity)}
              options={[
                { label: "久坐（办公室/学生）",       value: "sedentary" },
                { label: "轻度（每周 1-3 次锻炼）",   value: "light" },
                { label: "中度（每周 3-5 次锻炼）",   value: "moderate" },
                { label: "高强度（每周 6-7 次）",     value: "active" },
                { label: "极高（体力劳动 + 每日训练）",value: "very_active" },
              ]}
            />
          </Field>
        </div>

        {/* 预览卡 */}
        {preview && (
          <div className="relative overflow-hidden rounded-2xl bg-[#0E1116] border border-[#00E5FF]/20
                          shadow-[inset_0_1px_0_0_rgba(0,229,255,0.08)] p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24"
                 style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,229,255,0.10) 0%, transparent 65%)" }} />
            <div className="relative">
              <p className="label-micro">预计每日热量目标</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="font-display text-[48px] font-bold leading-none tracking-[-0.03em] text-[#00E5FF]">
                  {fmt(preview.target_kcal)}
                </span>
                <span className="label-micro mb-2">KCAL / DAY</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <KV k="BMR"  v={fmt(preview.bmr)} />
                <KV k="TDEE" v={fmt(preview.tdee)} />
                <KV k="目标" v={goal === "cut" ? "减脂" : goal === "bulk" ? "增肌" : "维持"} />
              </div>
              {(preview.notes?.length ?? 0) > 0 && (
                <p className="mt-3 text-[12px] text-[#FBBF24]">
                  提示：{preview.notes!.join("；")}
                </p>
              )}
            </div>
          </div>
        )}

        <Button size="lg" className="w-full" onClick={submit} disabled={saving}>
          {saving ? "保存中…" : "保存并开始"}
        </Button>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="label-micro pl-0.5">{label}</label>
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-white/4 py-2.5 px-2">
      <div className="label-micro text-center">{k}</div>
      <div className="font-display mt-1 text-[16px] font-bold text-center tabular-nums text-[#F5F7FA]">{v}</div>
    </div>
  );
}
