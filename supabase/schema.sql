-- ========================================================================
-- AI 健身助手 —— Supabase Postgres Schema（V0.2，Web + 手机端）
-- 在 Supabase 控制台 → SQL Editor 中一次性执行本文件
-- 所有表都启用 RLS，并仅允许 auth.uid() = user_id 的当前用户读写
-- ========================================================================

-- 启用 UUID 生成与 pgcrypto
create extension if not exists "pgcrypto";

-- ========== 枚举类型 ==========
do $$ begin
  create type gender_enum as enum ('male','female');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_enum as enum ('cut','bulk','maintain');
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_enum as enum ('sedentary','light','moderate','active','very_active');
exception when duplicate_object then null; end $$;

do $$ begin
  create type slot_enum as enum ('breakfast','lunch','dinner','snack');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meal_source_enum as enum ('manual','ai_photo','ai_recommend');
exception when duplicate_object then null; end $$;

do $$ begin
  create type photo_kind_enum as enum ('future_body');
exception when duplicate_object then null; end $$;

-- ========== profiles：用户档案 ==========
create table if not exists public.profiles (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  nickname          text,
  gender            gender_enum   not null,
  age               int           not null check (age between 14 and 80),
  height_cm         numeric(5,1)  not null check (height_cm between 120 and 220),
  weight_kg         numeric(5,1)  not null check (weight_kg between 30 and 200),
  weight_target_kg  numeric(5,1)  check (weight_target_kg between 30 and 200),
  activity          activity_enum not null default 'light',
  goal              goal_enum     not null default 'maintain',
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now()
);

-- ========== daily_logs：每日热量&体重日志 ==========
create table if not exists public.daily_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  target_kcal  int  not null default 0,
  intake_kcal  int  not null default 0,
  burn_kcal    int  not null default 0,
  weight_kg    numeric(5,1),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists idx_daily_logs_user_date on public.daily_logs (user_id, date desc);

-- ========== templates：训练模板（内置 user_id=null） ==========
create table if not exists public.templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade, -- null = 系统内置
  name       text not null,
  level      text not null check (level in ('beginner','intermediate','advanced')),
  split      text not null check (split in ('upper','lower','full','push','pull','legs','cardio')),
  items      jsonb not null, -- [{exerciseId, sets, reps}]
  created_at timestamptz not null default now()
);
create index if not exists idx_templates_user on public.templates (user_id);

-- ========== workouts：训练记录 ==========
create table if not exists public.workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  template_id  uuid references public.templates(id) on delete set null,
  name         text not null,
  sets         jsonb not null, -- [{exerciseId, weight, reps, rir}]
  total_volume numeric(10,2) not null default 0,
  burn_kcal    int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_workouts_user_date on public.workouts (user_id, date desc);

-- ========== meals：饮食记录 ==========
create table if not exists public.meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  slot       slot_enum not null,
  items      jsonb not null, -- [{name, kcal, protein, fat, carb, qty}]
  kcal       int not null default 0,
  protein    numeric(6,1) not null default 0,
  fat        numeric(6,1) not null default 0,
  carb       numeric(6,1) not null default 0,
  photo_url  text,
  source     meal_source_enum not null default 'manual',
  created_at timestamptz not null default now()
);
create index if not exists idx_meals_user_date on public.meals (user_id, date desc);

-- ========== badges：徽章记录 ==========
create table if not exists public.badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  code       text not null,
  earned_at  timestamptz not null default now(),
  meta       jsonb not null default '{}'::jsonb,
  unique (user_id, code)
);

-- ========== generated_photos：AI 未来照片 ==========
create table if not exists public.generated_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       photo_kind_enum not null default 'future_body',
  input_url  text not null,
  output_url text not null,
  weeks      int  not null check (weeks between 4 and 24),
  goal       goal_enum not null,
  gender     gender_enum not null,
  model      text not null,
  cost_cents int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_photos_user on public.generated_photos (user_id, created_at desc);
create index if not exists idx_photos_expires on public.generated_photos (expires_at);

-- ========== 自动更新 updated_at ==========
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles
for each row execute function public.tg_touch_updated_at();

drop trigger if exists touch_daily_logs on public.daily_logs;
create trigger touch_daily_logs before update on public.daily_logs
for each row execute function public.tg_touch_updated_at();

-- ========================================================================
-- 行级安全策略（RLS）—— 所有表默认启用并仅允许本人访问
-- ========================================================================
alter table public.profiles         enable row level security;
alter table public.daily_logs       enable row level security;
alter table public.templates        enable row level security;
alter table public.workouts         enable row level security;
alter table public.meals            enable row level security;
alter table public.badges           enable row level security;
alter table public.generated_photos enable row level security;

-- 每次重建策略前先删除（脚本可重复执行）
drop policy if exists "profiles read self"   on public.profiles;
drop policy if exists "profiles write self"  on public.profiles;
drop policy if exists "daily read self"      on public.daily_logs;
drop policy if exists "daily write self"     on public.daily_logs;
drop policy if exists "tpl read"             on public.templates;
drop policy if exists "tpl write self"       on public.templates;
drop policy if exists "workouts read self"   on public.workouts;
drop policy if exists "workouts write self"  on public.workouts;
drop policy if exists "meals read self"      on public.meals;
drop policy if exists "meals write self"     on public.meals;
drop policy if exists "badges read self"     on public.badges;
drop policy if exists "badges write self"    on public.badges;
drop policy if exists "photos read self"     on public.generated_photos;
drop policy if exists "photos write self"    on public.generated_photos;

create policy "profiles read self"  on public.profiles   for select using (auth.uid() = user_id);
create policy "profiles write self" on public.profiles   for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily read self"     on public.daily_logs for select using (auth.uid() = user_id);
create policy "daily write self"    on public.daily_logs for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- templates 内置模板（user_id is null）对所有登录用户可读；个人模板仅本人
create policy "tpl read"            on public.templates  for select using (user_id is null or auth.uid() = user_id);
create policy "tpl write self"      on public.templates  for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workouts read self"  on public.workouts   for select using (auth.uid() = user_id);
create policy "workouts write self" on public.workouts   for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meals read self"     on public.meals      for select using (auth.uid() = user_id);
create policy "meals write self"    on public.meals      for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "badges read self"    on public.badges     for select using (auth.uid() = user_id);
create policy "badges write self"   on public.badges     for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "photos read self"    on public.generated_photos for select using (auth.uid() = user_id);
create policy "photos write self"   on public.generated_photos for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========================================================================
-- 内置训练模板种子（7 个基础模板）
-- ========================================================================
insert into public.templates (user_id, name, level, split, items)
values
  (null,'新手全身 A','beginner','full','[{"exerciseId":"goblet_squat","sets":3,"reps":10},{"exerciseId":"pushup","sets":3,"reps":10},{"exerciseId":"db_row","sets":3,"reps":10},{"exerciseId":"plank","sets":3,"reps":30}]'::jsonb),
  (null,'新手全身 B','beginner','full','[{"exerciseId":"db_romanian_dl","sets":3,"reps":10},{"exerciseId":"incline_pushup","sets":3,"reps":10},{"exerciseId":"lat_pulldown","sets":3,"reps":10},{"exerciseId":"dead_bug","sets":3,"reps":12}]'::jsonb),
  (null,'居家徒手减脂 20 分钟','beginner','cardio','[{"exerciseId":"jumping_jack","sets":3,"reps":40},{"exerciseId":"pushup","sets":3,"reps":10},{"exerciseId":"bw_squat","sets":3,"reps":20},{"exerciseId":"mountain_climber","sets":3,"reps":40}]'::jsonb),
  (null,'上肢推（胸肩三头）','intermediate','push','[{"exerciseId":"bench_press","sets":4,"reps":8},{"exerciseId":"db_shoulder_press","sets":3,"reps":10},{"exerciseId":"triceps_pushdown","sets":3,"reps":12}]'::jsonb),
  (null,'上肢拉（背二头）','intermediate','pull','[{"exerciseId":"lat_pulldown","sets":4,"reps":10},{"exerciseId":"db_row","sets":3,"reps":10},{"exerciseId":"db_curl","sets":3,"reps":12}]'::jsonb),
  (null,'下肢（股四、臀、腘绳）','intermediate','legs','[{"exerciseId":"back_squat","sets":4,"reps":8},{"exerciseId":"db_romanian_dl","sets":3,"reps":10},{"exerciseId":"leg_curl","sets":3,"reps":12},{"exerciseId":"calf_raise","sets":3,"reps":15}]'::jsonb),
  (null,'有氧 · 快走 30 分钟','beginner','cardio','[{"exerciseId":"brisk_walk","sets":1,"reps":30}]'::jsonb)
on conflict do nothing;

-- ========================================================================
-- Storage（需要在 Supabase 控制台单独创建 Buckets，再执行策略）
-- 请在 Storage → Create bucket 先创建：
--   1) meal-photos   （私有）
--   2) future-input  （私有）
--   3) future-output （私有）
-- 然后运行以下策略：
-- ========================================================================
-- 允许当前用户读写自己上传的饮食照片
drop policy if exists "meal photos rw self" on storage.objects;
create policy "meal photos rw self"
  on storage.objects for all
  using (bucket_id = 'meal-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'meal-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "future input rw self" on storage.objects;
create policy "future input rw self"
  on storage.objects for all
  using (bucket_id = 'future-input' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'future-input' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "future output rw self" on storage.objects;
create policy "future output rw self"
  on storage.objects for all
  using (bucket_id = 'future-output' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'future-output' and auth.uid()::text = (storage.foldername(name))[1]);
