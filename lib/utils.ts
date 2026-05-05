import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn 推荐的 class 合并工具 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 统一的日期字符串（YYYY-MM-DD，按北京时间） */
export function todayStr(offsetDays = 0): string {
  const now = new Date();
  // 转为北京时间（UTC+8），再减去/加上指定天数
  const tz = 8 * 60; // 北京偏移：480 分钟
  const local = new Date(now.getTime() + (tz - now.getTimezoneOffset()) * 60_000);
  local.setDate(local.getDate() + offsetDays);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 限制数字范围 */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** 格式化数字，默认保留 0 位小数 */
export function fmt(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** 简单的错误文本提取 */
export function errMsg(e: unknown, fallback = "出错了，请稍后重试"): string {
  if (!e) return fallback;
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message || fallback;
  return fallback;
}
