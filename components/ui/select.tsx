"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * 简化版手机端原生 <select>
 * —— 在 iOS/Android 上直接调用系统原生滚轮选择器，体验最佳。
 */
export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "appearance-none w-full h-12 rounded-xl border border-input bg-background " +
          "px-4 pr-10 text-base shadow-sm transition-colors " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 13l-5-5h10l-5 5z" clipRule="evenodd" />
      </svg>
    </div>
  )
);
Select.displayName = "Select";
