"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, Sparkles, AlertCircle } from "lucide-react";

/**
 * 未来身材预览页
 * 步骤：① 上传正面照 ② 选择周数 & 目标 ③ 勾选同意 ④ 生成
 */
export default function FuturePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [weeks, setWeeks] = useState(8);
  const [goal, setGoal] = useState<"cut" | "bulk">("cut");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ before: string; after: string } | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast.error("照片过大，请小于 8MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function generate() {
    if (!file) { toast.error("请先上传正面照"); return; }
    if (!agree) { toast.error("请阅读并勾选协议"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("weeks", String(weeks));
      fd.append("goal", goal);
      fd.append("gender", gender);

      const res = await fetch("/api/generate-future-photo", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }
      const json = await res.json();
      setResult({ before: json.before_url, after: json.after_url });
      toast.success("生成成功！");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header title="未来的我" back={!!result} />
      <main className="page-padding space-y-4">
        {!result ? (
          <>
            <div className="relative overflow-hidden rounded-2xl bg-[#0E1116] border border-white/8
                            shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20"
                   style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,229,255,0.09) 0%, transparent 65%)" }} />
              <div className="relative flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5 text-[#00E5FF]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#F5F7FA]">看看坚持 {weeks} 周后的你</p>
                  <p className="mt-1 text-[13px] text-[#5C6470] leading-relaxed">
                    上传一张正面照，AI 将根据你的目标生成一张激励图。
                  </p>
                </div>
              </div>
            </div>

            {/* 上传区 */}
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="预览"
                   className="w-full aspect-[3/4] object-cover rounded-2xl bg-muted" />
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    建议：光线充足、单人、面对镜头、胸腹可见
                  </p>
                </CardContent>
              </Card>
            )}

            <input ref={fileRef} type="file" accept="image/*" capture="user"
                   className="hidden" onChange={onFile} />
            <Button size="lg" className="w-full" variant="outline"
                    onClick={() => fileRef.current?.click()}>
              <Camera className="h-5 w-5 mr-2" />
              {preview ? "换一张" : "上传正面照"}
            </Button>

            {/* 参数选择 */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">目标</Label>
                    <Select value={goal}
                            onChange={(e) => setGoal(e.target.value as "cut" | "bulk")}
                            options={[
                              { label: "减脂", value: "cut" },
                              { label: "增肌", value: "bulk" },
                            ]} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">性别</Label>
                    <Select value={gender}
                            onChange={(e) => setGender(e.target.value as "male" | "female")}
                            options={[
                              { label: "男", value: "male" },
                              { label: "女", value: "female" },
                            ]} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">坚持时长：{weeks} 周</Label>
                  <input type="range" min={4} max={24} step={2}
                         value={weeks}
                         onChange={(e) => setWeeks(Number(e.target.value))}
                         className="w-full accent-primary h-8" />
                </div>
              </CardContent>
            </Card>

            {/* 免责说明 & 同意 */}
            <div className="rounded-2xl bg-[#FBBF24]/8 border border-[#FBBF24]/20 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-[#FBBF24] shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="text-[12px] leading-relaxed text-[#A1A8B3]">
                <p>生成图片仅为 AI 想象、激励参考，非真实承诺或医疗建议。</p>
                <p className="mt-1">照片仅用于一次性生成，存储于私有云端并加水印，可随时删除。</p>
                <p className="mt-1 text-[#F87171]">未满 18 周岁严禁使用本功能。</p>
                <label className="mt-3 flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agree}
                         onChange={(e) => setAgree(e.target.checked)}
                         className="mt-0.5 scale-110 accent-[#00E5FF]" />
                  <span className="text-[#F5F7FA]">我已年满 18 周岁，且上传的是本人正面照。</span>
                </label>
              </div>
            </div>

            <Button size="lg" className="w-full"
                    onClick={generate}
                    disabled={loading || !agree || !file}>
              {loading ? "AI 正在为你画下未来…（约 20 秒）" : `生成 ${weeks} 周后的我`}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-[#0E1116] border border-white/8
                            shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-[#00E5FF]" strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-semibold text-[#F5F7FA]">{weeks} 周后的你</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl overflow-hidden border border-white/8">
                  <div className="label-micro text-center py-1.5 bg-white/5">现在</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.before} alt="现在" className="w-full aspect-[3/4] object-cover" />
                </div>
                <div className="rounded-xl overflow-hidden border border-[#00E5FF]/30"
                     style={{ boxShadow: "0 0 12px -4px rgba(0,229,255,0.25)" }}>
                  <div className="label-micro text-center py-1.5 bg-[#00E5FF]/10 text-[#00E5FF]">
                    {weeks} 周后
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.after} alt={`${weeks}周后`} className="w-full aspect-[3/4] object-cover" />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-center text-[#3A4049]">
                AI 生成参考图，非承诺，水印已添加
              </p>
            </div>

            <Button size="lg" variant="outline" className="w-full"
                    onClick={() => { setResult(null); setPreview(null); setFile(null); }}>
              换一张再来
            </Button>
            <Button size="lg" className="w-full" onClick={() => router.push("/")}>
              回到首页
            </Button>
          </>
        )}
      </main>
      {!result && <Navbar />}
    </>
  );
}
