"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold " +
  "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-[#00E5FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090C] " +
  "disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#00E5FF] text-black shadow-[0_0_20px_-4px_rgba(0,229,255,0.45)] " +
          "hover:bg-[#33ECFF] hover:shadow-[0_0_28px_-4px_rgba(0,229,255,0.6)]",
        outline:
          "border border-white/20 bg-transparent text-[#F5F7FA] " +
          "hover:border-white/30 hover:bg-white/5",
        ghost:
          "bg-transparent text-[#A1A8B3] hover:bg-white/5 hover:text-[#F5F7FA]",
        destructive:
          "bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30 hover:bg-[#F87171]/20",
        secondary:
          "bg-[#1C2129] text-[#F5F7FA] border border-white/8 hover:bg-[#222B35]",
        link:
          "bg-transparent text-[#00E5FF] underline-offset-4 hover:underline p-0 h-auto shadow-none",
      },
      size: {
        default: "h-12 px-5 rounded-xl text-[15px]",
        sm:      "h-9  px-3 rounded-lg  text-[13px]",
        lg:      "h-14 px-6 rounded-xl  text-[16px] font-semibold",
        icon:    "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
