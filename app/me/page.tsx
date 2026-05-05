import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { calcDailyTarget } from "@/lib/calc";
import { fmt } from "@/lib/utils";
import { ChevronRight, LogOut, FileText, Shield, MessageCircle } from "lucide-react";
import Link from "next/link";

export default async function MePage() {
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

  let preview;
  try {
    preview = calcDailyTarget({
      gender:        profile.gender,
      age:           profile.age,
      height:        profile.height_cm,
      weight:        profile.weight_kg,
      weight_target: profile.weight_target_kg ?? profile.weight_kg,
      activity:      profile.activity,
    });
  } catch {
    preview = { bmr: 0, tdee: 0, target_kcal: 0 };
  }

  const nickname = profile.nickname || user.email?.split("@")[0] || "U";
  const initial  = nickname.slice(0, 1).toUpperCase();

  const ACT: Record<string, string> = {
    sedentary: "久坐", light: "轻度", moderate: "中度", active: "高度", very_active: "极高",
  };
  const GOAL: Record<string, string> = { cut: "减脂", bulk: "增肌", maintain: "维持" };

  return (
    <>
      <Header title="我的" />
      <main className="page-padding space-y-4">

        {/* 用户卡 */}
        <div className="relative overflow-hidden rounded-2xl bg-[#0E1116] border border-white/8
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20"
               style={{ background: "radial-gradient(ellipse at 30% -10%, rgba(0,229,255,0.08) 0%, transparent 60%)" }} />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#161A21] border border-white/10
                            flex items-center justify-center shrink-0"
                 style={{ boxShadow: "0 0 0 1px rgba(0,229,255,0.2)" }}>
              <span className="font-display text-[26px] font-bold text-[#F5F7FA]">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-semibold text-[#F5F7FA] truncate">{nickname}</p>
              <p className="text-[12px] text-[#5C6470] truncate mt-0.5">{user.email}</p>
              <div className="mt-2 inline-flex items-center rounded-full bg-[#00E5FF]/10
                              text-[#00E5FF] px-2.5 py-0.5 text-micro uppercase tracking-[0.06em]">
                {GOAL[profile.goal] ?? profile.goal}
              </div>
            </div>
          </div>
        </div>

        {/* BMR / TDEE / 目标 三列超大数字 */}
        <div className="rounded-2xl bg-[#0E1116] border border-white/8
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="grid grid-cols-3 divide-x divide-white/6 text-center py-5 px-2">
            <DataStat label="BMR"    value={fmt(preview.bmr)} />
            <DataStat label="TDEE"   value={fmt(preview.tdee)} />
            <DataStat label="目标"   value={fmt(preview.target_kcal)} accent />
          </div>
          <div className="border-t border-white/6 px-4 pb-4 pt-3">
            <Link href="/onboarding">
              <Button variant="outline" className="w-full">编辑档案</Button>
            </Link>
          </div>
        </div>

        {/* 档案信息 */}
        <div className="rounded-2xl bg-[#0E1116] border border-white/8
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] divide-y divide-white/[0.05]">
          <InfoRow k="性别"    v={profile.gender === "male" ? "男" : "女"} />
          <InfoRow k="年龄"    v={`${profile.age} 岁`} />
          <InfoRow k="身高"    v={`${profile.height_cm} cm`} />
          <InfoRow k="体重"    v={`${profile.weight_kg} kg`} />
          <InfoRow k="目标体重" v={profile.weight_target_kg ? `${profile.weight_target_kg} kg` : "未设置"} />
          <InfoRow k="活动强度" v={ACT[profile.activity] ?? profile.activity} />
        </div>

        {/* 设置列表 */}
        <div className="rounded-2xl bg-[#0E1116] border border-white/8
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] divide-y divide-white/[0.05]">
          <MenuItem icon={FileText}      label="隐私政策"  href="/privacy" />
          <MenuItem icon={Shield}        label="用户协议"  href="/terms" />
          <MenuItem icon={MessageCircle} label="意见反馈"  href="mailto:feedback@example.com" />
        </div>

        {/* 退出 */}
        <form action="/api/logout" method="post">
          <Button type="submit" variant="destructive" size="lg" className="w-full gap-2">
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            退出登录
          </Button>
        </form>

      </main>
      <Navbar />
    </>
  );
}

function DataStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-2">
      <p className="label-micro">{label}</p>
      <p className="font-display mt-1.5 text-[28px] font-bold leading-none tabular-nums"
         style={{ color: accent ? "#00E5FF" : "#F5F7FA" }}>
        {value}
      </p>
      <p className="label-micro mt-1">KCAL</p>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[13px] text-[#5C6470]">{k}</span>
      <span className="text-[13px] font-medium text-[#A1A8B3]">{v}</span>
    </div>
  );
}

function MenuItem({
  icon: Icon, label, href,
}: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="h-[18px] w-[18px] text-[#5C6470]" strokeWidth={1.75} />
      <span className="flex-1 text-[14px] text-[#A1A8B3]">{label}</span>
      <ChevronRight className="h-4 w-4 text-[#3A4049]" strokeWidth={1.5} />
    </Link>
  );
}
