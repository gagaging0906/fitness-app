import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full text-micro uppercase tracking-[0.06em] font-medium transition-colors",
  {
    variants: {
      variant: {
        // Soft：带色背景 + 同色字
        default:  "bg-[#00E5FF]/10 text-[#00E5FF]          px-2.5 py-0.5",
        success:  "bg-[#4ADE80]/12 text-[#4ADE80]          px-2.5 py-0.5",
        warning:  "bg-[#FBBF24]/12 text-[#FBBF24]          px-2.5 py-0.5",
        danger:   "bg-[#F87171]/12 text-[#F87171]          px-2.5 py-0.5",
        info:     "bg-[#60A5FA]/12 text-[#60A5FA]          px-2.5 py-0.5",
        // Outline
        outline:  "border border-white/20 text-[#A1A8B3]   px-2.5 py-0.5",
        // Neutral muted
        secondary:"bg-white/8 text-[#A1A8B3]               px-2.5 py-0.5",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
