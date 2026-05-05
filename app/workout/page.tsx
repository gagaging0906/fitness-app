import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Navbar } from "@/components/Navbar";
import { TemplateBrowser } from "@/components/TemplateBrowser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Template } from "@/lib/supabase/types";

export default async function WorkoutPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawTemplates } = await supabase
    .from("templates")
    .select("id,name,level,category,split,items")
    .order("category", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: recent } = await supabase
    .from("workouts")
    .select("id,date,name,total_volume,burn_kcal")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(5);

  const templates = (rawTemplates ?? []) as Template[];

  return (
    <>
      <Header
        title="训练"
        right={
          <Link href="/workout/new">
            <Button size="sm" variant="ghost" className="gap-1">
              <Plus className="h-4 w-4" /> 空白记录
            </Button>
          </Link>
        }
      />
      <main className="page-padding space-y-5 pb-24">
        {/* 模板库 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">训练计划库</h2>
            <Link href="/workout/template/new" className="text-xs text-primary">
              + 自建计划
            </Link>
          </div>
          <TemplateBrowser templates={templates} />
        </section>

        {/* 最近记录 */}
        <section>
          <h2 className="text-sm font-semibold mb-3">最近训练</h2>
          {recent && recent.length > 0 ? (
            <div className="space-y-2">
              {recent.map((w) => (
                <Link key={w.id} href={`/workout/${w.id}`} className="block">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{w.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {w.date} · 总量 {Number(w.total_volume).toFixed(0)} kg
                          {w.burn_kcal ? ` · 消耗 ${w.burn_kcal} kcal` : ""}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                还没有训练记录，从计划库选个计划开始吧
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      <Navbar />
    </>
  );
}
