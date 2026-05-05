"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, UtensilsCrossed, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/",        label: "首页", icon: Home },
  { href: "/workout", label: "训练", icon: Dumbbell },
  { href: "/meal",    label: "饮食", icon: UtensilsCrossed },
  { href: "/future",  label: "未来", icon: Sparkles },
  { href: "/me",      label: "我的", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    /* 浮岛容器：左右留 12px，圆角 20px，底部 safe area + 12px */
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] px-3 z-40 pointer-events-none"
      style={{ paddingBottom: "calc(var(--safe-bottom) + 12px)" }}
    >
      <nav
        className={cn(
          "pointer-events-auto",
          "flex items-stretch justify-around",
          "rounded-[20px] px-2 py-2",
          "bg-[#161A21]/90 backdrop-blur-2xl",
          "border border-white/10",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.6)]"
        )}
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center gap-1 py-1.5 min-w-0"
            >
              <Icon
                className={cn(
                  "h-[22px] w-[22px] transition-colors duration-150",
                  active ? "text-[#00E5FF]" : "text-[#5C6470]"
                )}
                strokeWidth={active ? 2 : 1.75}
              />
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide transition-colors duration-150",
                  active ? "text-[#00E5FF]" : "text-[#5C6470]"
                )}
              >
                {label}
              </span>
              {/* 2px 底线指示器 */}
              {active && (
                <span
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full"
                  style={{
                    background: "#00E5FF",
                    boxShadow: "0 0 6px rgba(0,229,255,0.7)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
