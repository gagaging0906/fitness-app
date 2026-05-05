import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-xl border-0 bg-white/[0.04] px-4 py-2 " +
        "text-base text-[#F5F7FA] ring-1 ring-white/10 " +
        "placeholder:text-[#A1A8B3] " +
        "transition-all duration-150 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]/60 " +
        "focus-visible:ring-offset-0 focus-visible:bg-white/[0.06] " +
        "disabled:cursor-not-allowed disabled:opacity-40 " +
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // 数字输入自动切 display 字体
        (type === "number" || props.inputMode === "numeric" || props.inputMode === "decimal")
          ? "font-display tabular-nums"
          : "",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
