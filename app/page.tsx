import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { calcDailyTarget } from "@/lib/calc";
import { todayStr } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { KcalCard } from "@/components/KcalCard";
import { FutureBodyCard } from "@/components/FutureBodyCard";
import { QuoteCard } from "@/components/QuoteCard";
import { Dumbbell, UtensilsCrossed, Camera } from "lucide-react";
import { Greeting } from "@/components/Greeting";

export default async function HomePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (!rawProfile) redirect("/onboarding");

  const profile = {
    ...rawProfile,
    age:              Number(rawProfile.age),
    height_cm:        Number(rawProfile.height_cm),
    weight_kg:        Number(rawProfile.weight_kg),
    weight_target_kg: rawProfile.weight_target_kg != null
      ? Number(rawProfile.weight_target_kg) : null,
  };

  const date = todayStr();
  const { data: log } = await supabase
    .from("daily_logs").select("*")
    .eq("user_id", user.id).eq("date", date).maybeSingle();

  let computedTarget = 0;
  try {
    const r = calcDailyTarget({
      gender:       profile.gender,
      age:          profile.age,
      height:       profile.height_cm,
      weight:       profile.weight_kg,
      weight_target: profile.weight_target_kg ?? profile.weight_kg,
      activity:     profile.activity,
    });
    computedTarget = r.target_kcal;
  } catch {
    computedTarget = profile.gender === "male" ? 2000 : 1600;
  }

  const target = Number((log as { target_kcal?: number } | null)?.target_kcal) || computedTarget;
  const intake = Number((log as { intake_kcal?: number } | null)?.intake_kcal) || 0;
  const burn   = Number((log as { burn_kcal?: number } | null)?.burn_kcal)   || 0;

  // 最近未来照片
  const { data: photo } = await supabase
    .from("generated_photos").select("*")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  // 最近 7 天日志（用于周均完成率）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const { data: weeklyLogs } = await supabase
    .from("daily_logs").select("date,intake_kcal,burn_kcal,target_kcal")
    .eq("user_id", user.id)
    .gte("date", sevenDaysAgo.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  const weekIntake = (weeklyLogs ?? []).map((l) => Number((l as { intake_kcal?: number }).intake_kcal) || 0);
  const weekBurn   = (weeklyLogs ?? []).map((l) => Number((l as { burn_kcal?: number }).burn_kcal)   || 0);

  const nickname = profile.nickname || user.email?.split("@")[0] || "你";
  const goalLabel = profile.goal === "cut" ? "减脂" : profile.goal === "bulk" ? "增肌" : "维持";

  return (
    <>
      <Header
        title=""
        right={
          <Link href="/me" className="h-9 w-9 rounded-full flex items-center justify-center
                                       bg-[#1C2129] border border-white/10 text-[#F5F7FA]
                                       text-[13px] font-bold hover:border-[#00E5FF]/40 transition-colors">
            {nickname.slice(0, 1).toUpperCase()}
          </Link>
        }
      />

      <main className="page-padding space-y-4">
        {/* 问候 */}
        <div className="animate-fade-up">
          <Greeting nickname={nickname} goalLabel={goalLabel} weight={profile.weight_kg} targetWeight={profile.weight_target_kg ?? profile.weight_kg} />
        </div>

        {/* Hero 卡路里卡片 */}
        <div className="animate-fade-up" style={{ animationDelay: "50ms" }}>
          <KcalCard target={target} intake={intake} burn={burn} />
        </div>

        {/* 数据小网格 */}
        <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <MiniStatCard
            label="本周摄入趋势"
            value={intake}
            unit="kcal 今日"
            sparkData={weekIntake}
          />
          <MiniStatCard
            label="本周消耗趋势"
            value={burn}
            unit="kcal 今日"
            sparkData={weekBurn}
            accent
          />
        </div>

        {/* 快捷操作 */}
        <div className="grid grid-cols-3 gap-2 animate-fade-up" style={{ animationDelay: "150ms" }}>
          <QuickAction href="/workout/new" icon={Dumbbell} label="记录训练" />
          <QuickAction href="/meal/new"    icon={UtensilsCrossed} label="记录饮食" />
          <QuickAction href="/meal/scan"   icon={Camera} label="拍照识餐" />
        </div>

        {/* AI 未来照片 */}
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <FutureBodyCard
            hasPhoto={!!photo}
            weeks={(photo as { weeks?: number } | null)?.weeks}
            goal={(photo as { goal?: "cut"|"bulk"|"maintain" } | null)?.goal}
            beforeUrl={(photo as { input_url?: string } | null)?.input_url}
            afterUrl={(photo as { output_url?: string } | null)?.output_url}
          />
        </div>

        {/* 每日鼓励 */}
        <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
          <QuoteCard
            text="每天只要进步 1%，一年就是 37 倍的自己。"
            author="复利法则"
          />
        </div>
      </main>

      <Navbar />
    </>
  );
}

/* ── 问候子组件（移到 components/Greeting.tsx） ─────────────────────────── */

/* ── Mini 数据卡 ─────────────────────────────────────────────────────────── */
function MiniStatCard({
  label, value, unit, sparkData, accent,
}: {
  label: string; value: number; unit: string; sparkData: number[]; accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0E1116] border border-white/8
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-4">
      <p className="label-micro">{label}</p>
      <p className="font-display mt-2 text-[22px] font-bold leading-none tabular-nums"
         style={{ color: accent ? "#00E5FF" : "#F5F7FA" }}>
        {value.toLocaleString("zh-CN")}
      </p>
      <p className="mt-0.5 text-[11px] text-[#5C6470]">{unit}</p>
      {/* 迷你 sparkline */}
      {sparkData.length > 1 && (
        <div className="mt-3">
          <Sparkline data={sparkData} accent={accent} />
        </div>
      )}
    </div>
  );
}

/* ── Sparkline SVG ───────────────────────────────────────────────────────── */
function Sparkline({ data, accent }: { data: number[]; accent?: boolean }) {
  const w = 100; const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = accent ? "#00E5FF" : "#A1A8B3";
  const lastPt = pts.split(" ").pop()?.split(",");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
      {lastPt && (
        <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color}
                style={{ filter: accent ? "drop-shadow(0 0 3px rgba(0,229,255,0.8))" : "none" }} />
      )}
    </svg>
  );
}

/* ── 快捷操作按钮 ────────────────────────────────────────────────────────── */
function QuickAction({
  href, icon: Icon, label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <Link href={href} className="block active:scale-[0.96] transition-transform">
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#0E1116] border border-white/8
                      py-4 hover:border-white/16 transition-colors
                      shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="h-10 w-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#00E5FF]" strokeWidth={1.75} />
        </div>
        <span className="text-[12px] font-medium text-[#A1A8B3]">{label}</span>
      </div>
    </Link>
  );
}
