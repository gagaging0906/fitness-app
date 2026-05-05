"use client";
/**
 * KcalCard — 暗夜驾驶舱版本
 * Hero 数字 + 水平进度条 + 三列底部统计，数字 count-up 动画
 */
import { useCountUp } from "@/lib/use-count-up";

export interface KcalCardProps {
  target: number;
  intake: number;
  burn:   number;
}

export function KcalCard({ target, intake, burn }: KcalCardProps) {
  const effective = target + burn;
  const remaining = effective - intake;
  const over      = remaining < 0;
  const progress  = effective > 0 ? Math.min(intake / effective, 1) * 100 : 0;

  const animRemaining = useCountUp(Math.abs(remaining), 1200);
  const animIntake    = useCountUp(intake,  900);
  const animBurn      = useCountUp(burn,    900);
  const animTarget    = useCountUp(target,  900);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0E1116] border border-white/8
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-6">
      {/* 顶部柔光晕 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36"
           style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,229,255,0.10) 0%, transparent 65%)" }} />

      <div className="relative">
        {/* Micro label */}
        <p className="label-micro">REMAINING TODAY</p>

        {/* Hero 数字 */}
        <div className="mt-2 flex items-end gap-2">
          <span
            className="font-display leading-none tabular-nums"
            style={{
              fontSize: "clamp(52px,14vw,72px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: over ? "#F87171" : "#F5F7FA",
            }}
          >
            {animRemaining.toLocaleString("zh-CN")}
          </span>
          <span className="label-micro mb-2">KCAL</span>
        </div>

        {/* 进度条 */}
        <div className="mt-4 progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 三列统计 */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-white/6 text-center">
          <StatCol label="目标"   value={animTarget} />
          <StatCol label="已摄入" value={animIntake} />
          <StatCol label="已消耗" value={animBurn}   accent />
        </div>
      </div>
    </div>
  );
}

function StatCol({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="py-1 px-2">
      <p className="label-micro">{label}</p>
      <p
        className="font-display mt-1 text-[18px] font-bold tabular-nums leading-none"
        style={{ color: accent ? "#00E5FF" : "#F5F7FA" }}
      >
        {value.toLocaleString("zh-CN")}
      </p>
    </div>
  );
}
