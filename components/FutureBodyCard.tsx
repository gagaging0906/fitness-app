"use client";
import { Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";

export interface FutureBodyCardProps {
  hasPhoto: boolean;
  weeks?: number;
  goal?: "cut" | "bulk" | "maintain";
  beforeUrl?: string;
  afterUrl?: string;
  onRegenerate?: () => void;
}

const GOAL_LABEL: Record<string, string> = {
  cut: "减脂", bulk: "增肌", maintain: "维持",
};

export function FutureBodyCard({
  hasPhoto, weeks = 8, goal = "cut", beforeUrl, afterUrl, onRegenerate,
}: FutureBodyCardProps) {
  if (!hasPhoto) {
    return (
      <Link href="/future" className="block">
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0E1116]
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5
                        hover:border-white/16 transition-colors">
          {/* 背景光晕 */}
          <div className="pointer-events-none absolute inset-0"
               style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(0,229,255,0.07) 0%, transparent 60%)" }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="label-micro mb-2">AI 身材预测</p>
              <h3 className="text-[16px] font-semibold text-[#F5F7FA] leading-snug">
                看见 {weeks} 周后的自己
              </h3>
              <p className="mt-1.5 text-[13px] text-[#5C6470] leading-relaxed">
                上传正面照，AI 生成坚持后的身材画面
              </p>
            </div>
            <div className="shrink-0 h-11 w-11 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#00E5FF]" strokeWidth={1.5} />
            </div>
          </div>
          <div className="relative mt-4 flex items-center gap-1.5 text-[#00E5FF] text-[13px] font-semibold">
            立即生成
            <span className="text-[16px]">→</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0E1116]
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="label-micro mb-1">AI 身材预测</p>
          <h3 className="text-[15px] font-semibold text-[#F5F7FA]">
            {weeks} 周后 · {GOAL_LABEL[goal]}
          </h3>
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 text-[12px] text-[#5C6470] hover:text-[#A1A8B3] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
            重新生成
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PhotoSlot label="现在" url={beforeUrl} />
        <PhotoSlot label={`${weeks} 周后`} url={afterUrl} accent />
      </div>
      <p className="mt-2 text-[10px] text-[#3A4049] text-center">
        图片由 AI 生成，仅供激励参考
      </p>
    </div>
  );
}

function PhotoSlot({ label, url, accent }: { label: string; url?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl overflow-hidden border ${accent ? "border-[#00E5FF]/30" : "border-white/8"}`}>
      <div className={`text-[11px] text-center py-1 font-medium tracking-wide
        ${accent ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "bg-white/5 text-[#5C6470]"}`}>
        {label}
      </div>
      {url
        ? <img src={url} alt={label} className="w-full aspect-[3/4] object-cover" />  // eslint-disable-line @next/next/no-img-element
        : <div className="w-full aspect-[3/4] bg-[#0E1116]" />}
    </div>
  );
}
