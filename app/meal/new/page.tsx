"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { todayStr, fmt } from "@/lib/utils";

interface FoodItem { name: string; qty: string; kcal: number; protein: number; fat: number; carb: number }

/** 手动录入一餐 */
export default function MealNewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = getBrowserSupabase();
  const [slot, setSlot] = useState<"breakfast" | "lunch" | "dinner" | "snack">(
    (sp.get("slot") as "breakfast" | "lunch" | "dinner" | "snack") || "lunch"
  );
  const [items, setItems] = useState<FoodItem[]>([
    { name: "", qty: "1 份", kcal: 0, protein: 0, fat: 0, carb: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const total = items.reduce(
    (s, x) => ({
      kcal: s.kcal + x.kcal,
      protein: s.protein + x.protein,
      fat: s.fat + x.fat,
      carb: s.carb + x.carb,
    }),
    { kcal: 0, protein: 0, fat: 0, carb: 0 }
  );

  function upd<K extends keyof FoodItem>(i: number, key: K, v: FoodItem[K]) {
    setItems((prev) => prev.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));
  }

  async function save() {
    if (items.filter((x) => x.name).length === 0) { toast.error("请至少填一项"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    const clean = items.filter((x) => x.name);
    const { error } = await supabase.from("meals").insert({
      user_id: user.id, date: todayStr(), slot,
      items: clean, kcal: Math.round(total.kcal),
      protein: Number(total.protein.toFixed(1)),
      fat: Number(total.fat.toFixed(1)),
      carb: Number(total.carb.toFixed(1)),
      source: "manual",
    });
    if (error) { toast.error(error.message); setSaving(false); return; }

    const { data: log } = await supabase
      .from("daily_logs").select("intake_kcal").eq("user_id", user.id).eq("date", todayStr()).maybeSingle();
    await supabase.from("daily_logs").upsert({
      user_id: user.id, date: todayStr(),
      intake_kcal: (log?.intake_kcal || 0) + Math.round(total.kcal),
    });

    setSaving(false);
    toast.success("已记录");
    router.replace("/meal");
  }

  return (
    <>
      <Header title="手动记录" back />
      <main className="page-padding space-y-4">
        <div className="space-y-2">
          <Label>时段</Label>
          <Select
            value={slot}
            onChange={(e) => setSlot(e.target.value as typeof slot)}
            options={[
              { label: "早餐", value: "breakfast" },
              { label: "午餐", value: "lunch" },
              { label: "晚餐", value: "dinner" },
              { label: "加餐", value: "snack" },
            ]}
          />
        </div>

        <div className="space-y-2">
          {items.map((x, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={x.name} onChange={(e) => upd(i, "name", e.target.value)}
                         placeholder="食物名（如：蛋炒饭）" className="flex-1" />
                  <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}
                          className="tap-target text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={x.qty} onChange={(e) => upd(i, "qty", e.target.value)}
                         placeholder="份量（如：1 碗）" />
                  <Input type="number" inputMode="numeric" placeholder="热量 kcal"
                         value={x.kcal || ""}
                         onChange={(e) => upd(i, "kcal", Number(e.target.value) || 0)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" inputMode="decimal" placeholder="蛋白 g"
                         value={x.protein || ""}
                         onChange={(e) => upd(i, "protein", Number(e.target.value) || 0)} />
                  <Input type="number" inputMode="decimal" placeholder="脂肪 g"
                         value={x.fat || ""}
                         onChange={(e) => upd(i, "fat", Number(e.target.value) || 0)} />
                  <Input type="number" inputMode="decimal" placeholder="碳水 g"
                         value={x.carb || ""}
                         onChange={(e) => upd(i, "carb", Number(e.target.value) || 0)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" size="lg" className="w-full"
                onClick={() => setItems((p) => [...p, { name: "", qty: "1 份", kcal: 0, protein: 0, fat: 0, carb: 0 }])}>
          <Plus className="h-4 w-4 mr-2" /> 再加一项
        </Button>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm">合计</span>
            <span className="text-xl font-bold tabular-nums">{fmt(total.kcal)} kcal</span>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full" onClick={save} disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </main>
    </>
  );
}
