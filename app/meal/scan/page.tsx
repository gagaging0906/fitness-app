"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Camera } from "lucide-react";
import { todayStr, fmt } from "@/lib/utils";

interface FoodItem { name: string; qty: string; kcal: number; protein: number; fat: number; carb: number }

/**
 * 拍照识餐页 —— 调用 Gemini 识别，保存到 meals
 * 关键点：<input type="file" accept="image/*" capture="environment">
 * 在 iOS/Android 上会自动弹起相机，微信内置浏览器也兼容。
 */
export default function MealScanPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [slot, setSlot] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      // 上传到 Supabase Storage（私有 bucket）
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("meal-photos").upload(path, file);
      if (upErr) throw upErr;
      // 获取签名 URL 用于 AI 识别
      const { data: signed } = await supabase.storage.from("meal-photos")
        .createSignedUrl(path, 600);
      setPhotoUrl(signed?.signedUrl ?? null);

      // 调用识别 API
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/recognize-food", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error || "识别失败");
      const json = await res.json();
      setItems(json.items || []);
      toast.success(`识别到 ${json.items?.length || 0} 项食物`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "识别失败");
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce(
    (s, x) => ({
      kcal: s.kcal + x.kcal,
      protein: s.protein + x.protein,
      fat: s.fat + x.fat,
      carb: s.carb + x.carb,
    }),
    { kcal: 0, protein: 0, fat: 0, carb: 0 }
  );

  async function save() {
    if (items.length === 0) { toast.error("请先识别出食物"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { error } = await supabase.from("meals").insert({
      user_id: user.id,
      date: todayStr(),
      slot,
      items: items.map((x) => ({ name: x.name, qty: x.qty, kcal: x.kcal,
                                 protein: x.protein, fat: x.fat, carb: x.carb })),
      kcal: Math.round(total.kcal),
      protein: Number(total.protein.toFixed(1)),
      fat:     Number(total.fat.toFixed(1)),
      carb:    Number(total.carb.toFixed(1)),
      photo_url: photoUrl,
      source: "ai_photo",
    });
    if (error) { toast.error(error.message); setSaving(false); return; }

    // 更新 daily_logs.intake_kcal
    const { data: log } = await supabase
      .from("daily_logs").select("intake_kcal").eq("user_id", user.id).eq("date", todayStr()).maybeSingle();
    await supabase.from("daily_logs").upsert({
      user_id: user.id, date: todayStr(),
      intake_kcal: (log?.intake_kcal || 0) + Math.round(total.kcal),
    });

    setSaving(false);
    toast.success("已记录");
    router.replace("/meal");
  }

  return (
    <>
      <Header title="拍照识餐" back />
      <main className="page-padding space-y-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="预览"
               className="w-full aspect-[4/3] object-cover rounded-2xl bg-muted" />
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">拍一张饭菜照片，AI 自动识别热量</p>
            </CardContent>
          </Card>
        )}

        <input
          ref={fileRef} type="file"
          accept="image/*" capture="environment"
          className="hidden"
          onChange={onFile}
        />
        <Button
          size="lg" className="w-full"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          <Camera className="h-5 w-5 mr-2" />
          {preview ? "换一张" : "拍照 / 选择图片"}
        </Button>

        {loading && (
          <Card>
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              AI 正在识别食物……
            </CardContent>
          </Card>
        )}

        {items.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-muted-foreground">识别结果</div>
              <Select
                value={slot}
                onChange={(e) => setSlot(e.target.value as typeof slot)}
                options={[
                  { label: "早餐", value: "breakfast" },
                  { label: "午餐", value: "lunch" },
                  { label: "晚餐", value: "dinner" },
                  { label: "加餐", value: "snack" },
                ]}
              />
              {items.map((x, i) => (
                <Card key={i}>
                  <CardContent className="p-3 flex items-center gap-2">
                    <Input
                      value={x.name}
                      onChange={(e) => setItems((prev) => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))}
                      className="h-10 flex-1"
                    />
                    <Input
                      value={x.qty}
                      onChange={(e) => setItems((prev) => prev.map((p, idx) => idx === i ? { ...p, qty: e.target.value } : p))}
                      className="h-10 w-20"
                      placeholder="份量"
                    />
                    <Input
                      type="number" inputMode="numeric"
                      value={x.kcal}
                      onChange={(e) => setItems((prev) => prev.map((p, idx) => idx === i ? { ...p, kcal: Number(e.target.value) || 0 } : p))}
                      className="h-10 w-20 text-right"
                    />
                    <span className="text-xs text-muted-foreground">kcal</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm">合计</span>
                <span className="text-xl font-bold tabular-nums">{fmt(total.kcal)} kcal</span>
              </CardContent>
            </Card>

            <Button size="lg" className="w-full" onClick={save} disabled={saving}>
              {saving ? "保存中…" : "保存到今日"}
            </Button>
          </>
        )}
      </main>
    </>
  );
}
