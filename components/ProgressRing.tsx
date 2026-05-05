"use client";
import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value, max, size = 140, stroke = 10, label, sublabel, className,
}: ProgressRingProps) {
  const id = useId();
  const r   = (size - stroke) / 2;
  const c   = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const dash = pct * c;
  const cx  = size / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <filter id={`f-${id}`}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* 轨道 */}
        <circle cx={cx} cy={cx} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} strokeLinecap="round" />
        {/* 进度弧 */}
        {pct > 0 && (
          <circle cx={cx} cy={cx} r={r} fill="none"
            stroke={`url(#g-${id})`} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            filter={`url(#f-${id})`}
            style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)" }}
          />
        )}
      </svg>
      {/* 中心内容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label    && <div className="font-display text-2xl font-bold leading-tight text-[#F5F7FA]">{label}</div>}
        {sublabel && <div className="label-micro mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}
