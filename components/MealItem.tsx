"use client";
import { Card, CardContent } from "@/components/ui/card";
import { fmt } from "@/lib/utils";
import { Coffee, Utensils, Apple, Moon } from "lucide-react";

const SLOT_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  breakfast: { label: "早餐", Icon: Coffee },
  lunch:     { label: "午餐", Icon: Utensils },
  dinner:    { label: "晚餐", Icon: Moon },
  snack:     { label: "加餐", Icon: Apple },
};

export interface MealItemProps {
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  kcal: number;
  items: { name: string; qty?: string }[];
  photoUrl?: string;
  onClick?: () => void;
}

export function MealItem({ slot, kcal, items, photoUrl, onClick }: MealItemProps) {
  const meta = SLOT_META[slot];
  const Icon = meta.Icon;
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer active:scale-[0.99] transition-transform"
    >
      <CardContent className="p-4 flex items-center gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={meta.label}
               className="h-14 w-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
            <Icon className="h-7 w-7 text-[#00E5FF]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{meta.label}</span>
            <span className="text-sm tabular-nums">
              <span className="font-display font-bold tabular-nums text-[#00E5FF]">{fmt(kcal)}</span>
              <span className="text-xs text-[#5C6470] ml-0.5">kcal</span>
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground truncate">
            {items.map((x) => `${x.name}${x.qty ? ` · ${x.qty}` : ""}`).join("，") || "未记录"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
