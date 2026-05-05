"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Dumbbell, Play, Timer } from "lucide-react";
import Link from "next/link";
import type { Template, TemplateCategory, TemplateDays } from "@/lib/supabase/types";

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  beginner:    "新手",
  advanced:    "进阶",
  fat_loss:    "减脂",
  muscle_gain: "增肌",
};

const SPLIT_LABELS: Record<string, string> = {
  "2split":   "二分化", "3split": "三分化",
  "4split":   "四分化", "5split": "五分化",
  full_body:  "全身",   upper: "上肢", lower: "下肢",
  full: "全身", push: "推", pull: "拉", legs: "腿", cardio: "有氧",
};

const CATEGORIES: TemplateCategory[] = ["beginner", "advanced", "fat_loss", "muscle_gain"];

function parseDays(tpl: Template) {
  try {
    const items = tpl.items as unknown as TemplateDays;
    if (items?.version === 2) return items.days;
  } catch { /* ignore */ }
  return [];
}

export function TemplateBrowser({ templates }: { templates: Template[] }) {
  const [active, setActive]     = useState<TemplateCategory>("beginner");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = templates.filter((t) => t.category === active);

  return (
    <div>
      {/* 下划线 tab */}
      <div className="flex gap-1 border-b border-white/6 mb-4">
        {CATEGORIES.map((cat) => {
          const count = templates.filter((t) => t.category === cat).length;
          if (!count) return null;
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => { setActive(cat); setExpanded(null); }}
              className="relative pb-3 px-3 text-[14px] font-medium transition-colors"
              style={{ color: isActive ? "#00E5FF" : "#5C6470" }}
            >
              {CATEGORY_LABELS[cat]}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "#00E5FF", boxShadow: "0 0 6px rgba(0,229,255,0.6)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 计划卡片 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-[13px] text-[#5C6470] text-center py-8">暂无此分类计划</p>
        )}
        {filtered.map((tpl) => {
          const days = parseDays(tpl);
          const isOpen = expanded === tpl.id;
          return (
            <div key={tpl.id}
              className="overflow-hidden rounded-2xl bg-[#0E1116] border border-white/8
                         shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              {/* 标题行 */}
              <button className="w-full text-left"
                onClick={() => setExpanded(isOpen ? null : tpl.id)}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="h-10 w-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="h-5 w-5 text-[#00E5FF]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#F5F7FA] truncate">{tpl.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="label-micro bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[tpl.category]}
                      </span>
                      <span className="text-[12px] text-[#5C6470]">{SPLIT_LABELS[tpl.split] ?? tpl.split}</span>
                      <span className="text-[12px] text-[#3A4049]">· {days.length} 天</span>
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronDown  className="h-4 w-4 text-[#5C6470] shrink-0" strokeWidth={1.75} />
                    : <ChevronRight className="h-4 w-4 text-[#5C6470] shrink-0" strokeWidth={1.75} />}
                </div>
              </button>

              {/* 展开：每天列表 */}
              {isOpen && (
                <div className="border-t border-white/6 divide-y divide-white/[0.04]">
                  {days.map((day) => {
                    const hasCardio = day.exercises.some((e) => e.type === "cardio");
                    return (
                      <div key={day.day} className="flex items-start gap-3 px-4 py-3">
                        <div className="shrink-0 h-6 w-6 rounded-full bg-[#1C2129] border border-white/10
                                        flex items-center justify-center mt-0.5">
                          {hasCardio
                            ? <Timer    className="h-3 w-3 text-[#00E5FF]" strokeWidth={1.75} />
                            : <Dumbbell className="h-3 w-3 text-[#00E5FF]" strokeWidth={1.75} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#F5F7FA]">
                            第 {day.day} 天 · {day.name}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[#5C6470] leading-relaxed truncate">
                            {day.exercises.map((e) => e.name).join(" · ")}
                          </p>
                        </div>
                        <Link
                          href={`/workout/new?tpl=${tpl.id}&day=${day.day}`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5
                                     bg-[#00E5FF] text-black text-[12px] font-semibold
                                     active:scale-[0.96] transition-transform
                                     shadow-[0_0_14px_-4px_rgba(0,229,255,0.5)]"
                        >
                          <Play className="h-3 w-3" />开始
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
