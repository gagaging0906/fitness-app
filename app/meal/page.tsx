import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { MealItem } from "@/components/MealItem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Plus } from "lucide-react";
import { todayStr, fmt } from "@/lib/utils";

interface MealRow {
  id: string;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  kcal: number;
  protein: number; fat: number; carb: number;
  items: { name: string; qty?: string }[];
  photo_url: string | null;
}

export default async function MealPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const date = todayStr();
  const { data: meals } = await supabase
    .from("meals").select("id,slot,kcal,protein,fat,carb,items,photo_url")
    .eq("user_id", user.id).eq("date", date).order("created_at", { ascending: true });

  const all = (meals ?? []) as MealRow[];
  const totalKcal = all.reduce((s, m) => s + m.kcal, 0);
  const totalP = all.reduce((s, m) => s + Number(m.protein), 0);
  const totalF = all.reduce((s, m) => s + Number(m.fat), 0);
  const totalC = all.reduce((s, m) => s + Number(m.carb), 0);

  const bySlot: Record<string, MealRow[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  all.forEach((m) => bySlot[m.slot].push(m));

  return (
    <>
      <Header title="饮食" right={
        <Link href="/meal/scan">
          <Button size="sm" variant="ghost" className="gap-1">
            <Camera className="h-4 w-4" /> 拍照
          </Button>
        </Link>
      } />
      <main className="page-padding space-y-4">
        {/* 今日摄入汇总 */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0E1116] border border-white/8
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24"
               style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,229,255,0.09) 0%, transparent 65%)" }} />
          <div className="relative">
            <p className="label-micro">TODAY'S INTAKE</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-[42px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#F5F7FA]">
                {fmt(totalKcal)}
              </span>
              <span className="label-micro mb-2">KCAL</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Macro label="蛋白质" value={`${fmt(totalP, 1)} g`} />
              <Macro label="脂肪"   value={`${fmt(totalF, 1)} g`} />
              <Macro label="碳水"   value={`${fmt(totalC, 1)} g`} />
            </div>
          </div>
        </div>

        {(["breakfast", "lunch", "dinner", "snack"] as const).map((slot) => (
          <section key={slot}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[13px] font-semibold text-[#A1A8B3]">
                {SLOT_LABEL[slot]}
              </h2>
              <Link href={`/meal/new?slot=${slot}`} className="text-[#00E5FF] text-xs tap-target px-2 flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> 添加
              </Link>
            </div>
            <div className="space-y-2">
              {bySlot[slot].length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    暂无记录
                  </CardContent>
                </Card>
              ) : (
                bySlot[slot].map((m) => (
                  <MealItem
                    key={m.id}
                    slot={slot}
                    kcal={m.kcal}
                    items={m.items}
                    photoUrl={m.photo_url ?? undefined}
                  />
                ))
              )}
            </div>
          </section>
        ))}
      </main>
      <Navbar />
    </>
  );
}

const SLOT_LABEL: Record<string, string> = {
  breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐 / 零食",
};

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 py-2.5">
      <div className="label-micro text-center">{label}</div>
      <div className="font-display mt-1 text-[15px] font-bold tabular-nums text-center text-[#F5F7FA]">{value}</div>
    </div>
  );
}
