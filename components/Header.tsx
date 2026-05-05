"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header({
  title,
  back = false,
  right,
  className,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 safe-top",
        "bg-[#07090C]/80 backdrop-blur-xl",
        "border-b border-white/[0.05]",
        className
      )}
    >
      <div className="relative h-14 flex items-center justify-center px-4">
        {back && (
          <button
            onClick={() => router.back()}
            className="absolute left-3 tap-target h-9 w-9 rounded-[10px] flex items-center justify-center text-[#A1A8B3] hover:bg-white/8 hover:text-[#F5F7FA] transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
        )}
        <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-[#F5F7FA] truncate max-w-[58%]">
          {title}
        </h1>
        {right && <div className="absolute right-3">{right}</div>}
      </div>
    </header>
  );
}
