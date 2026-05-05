"use client";
import { useEffect, useRef, useState } from "react";

/**
 * 数字从 0 跳动到目标值，cubic ease-out
 * @param end      目标数值
 * @param duration 动画时长 ms（默认 1000）
 * @param active   false 时跳过动画直接显示终值
 */
export function useCountUp(end: number, duration = 1000, active = true): number {
  const [value, setValue] = useState(active ? 0 : end);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) { setValue(end); return; }
    let startTime: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      // cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [end, duration, active]);

  return value;
}
