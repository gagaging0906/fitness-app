"use client";

function getTimeLabel(): string {
  const h = new Date().getHours();
  if (h < 6)  return "深夜好";
  if (h < 12) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function Greeting({
  nickname,
  goalLabel,
  weight,
  targetWeight,
}: {
  nickname: string;
  goalLabel: string;
  weight: number;
  targetWeight: number;
}) {
  const diff = Math.abs(weight - targetWeight).toFixed(1);

  return (
    <div className="px-1">
      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#F5F7FA]">
        {getTimeLabel()}，{nickname}
      </h2>
      <p className="mt-0.5 text-[13px] text-[#5C6470]">
        目标 · {goalLabel}
        {Number(diff) > 0 && `  ·  还差 ${diff} kg`}
      </p>
    </div>
  );
}
