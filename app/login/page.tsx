"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  async function sendOtp() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("验证码已发送，请查收邮件");
    setPhase("otp");
    let sec = 60;
    setCountdown(sec);
    const t = setInterval(() => {
      sec -= 1;
      setCountdown(sec);
      if (sec <= 0) clearInterval(t);
    }, 1000);
  }

  async function verifyOtp() {
    if (otp.length < 6) { toast.error("验证码不完整，请检查后重试"); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email, token: otp, type: "email",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("登录成功");
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-center px-6 overflow-hidden">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80"
           style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,229,255,0.12) 0%, transparent 65%)" }} />

      <div className="relative w-full max-w-sm mx-auto space-y-8 animate-fade-up">
        {/* Logo 区 */}
        <div className="text-center space-y-3">
          <div className="font-display text-[56px] font-extrabold leading-none tracking-[-0.04em]"
               style={{ color: "#00E5FF", textShadow: "0 0 32px rgba(0,229,255,0.4)" }}>
            AI/FIT
          </div>
          <p className="text-[13px] text-[#5C6470] tracking-wide">
            科学减脂增肌 · 每天进步一点
          </p>
        </div>

        {/* 表单区 */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="label-micro pl-1">邮箱地址</label>
            <Input
              type="email" inputMode="email" autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={phase === "otp"}
            />
          </div>

          {phase === "otp" && (
            <div className="space-y-1.5 animate-fade-up">
              <label className="label-micro pl-1">邮箱验证码</label>
              <Input
                type="text" inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6,10}" maxLength={10}
                placeholder="请输入验证码"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
              <div className="text-right">
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={sendOtp}
                  className="text-[12px] text-[#00E5FF] disabled:text-[#3A4049] transition-colors"
                >
                  {countdown > 0 ? `${countdown}s 后重新发送` : "重新发送"}
                </button>
              </div>
            </div>
          )}

          <Button
            size="lg" className="w-full mt-2"
            disabled={loading}
            onClick={phase === "email" ? sendOtp : verifyOtp}
          >
            {loading ? "处理中…" : phase === "email" ? "获取验证码" : "验证并登录"}
          </Button>
        </div>

        <p className="text-center text-[11px] text-[#A1A8B3] leading-relaxed">
          登录即同意《用户协议》与《隐私政策》<br />本服务仅供健康管理参考，不构成医疗建议
        </p>
      </div>
    </main>
  );
}
