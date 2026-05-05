"use client";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface WorkoutCardProps {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  split: string;
  exerciseCount: number;
  href: string;
}

const LEVEL_LABEL: Record<string, { text: string; className: string }> = {
  beginner:     { text: "新手",  className: "bg-emerald-100 text-emerald-700" },
  intermediate: { text: "进阶",  className: "bg-blue-100 text-blue-700" },
  advanced:     { text: "高级",  className: "bg-purple-100 text-purple-700" },
};

const SPLIT_LABEL: Record<string, string> = {
  full: "全身", upper: "上肢", lower: "下肢",
  push: "推", pull: "拉", legs: "腿", cardio: "有氧",
};

export function WorkoutCard({ name, level, split, exerciseCount, href }: WorkoutCardProps) {
  const lv = LEVEL_LABEL[level];
  return (
    <Link href={href} className="block active:scale-[0.99] transition-transform">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{name}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge className={lv?.className}>{lv?.text}</Badge>
              <span>{SPLIT_LABEL[split] ?? split}</span>
              <span>· {exerciseCount} 个动作</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
