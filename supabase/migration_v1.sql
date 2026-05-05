-- ========================================================================
-- V1 迁移：训练模板重构
-- 在 Supabase SQL Editor 执行（schema.sql 之后执行一次）
-- ========================================================================

-- 1. templates 加 category 列
alter table public.templates
  add column if not exists category text
  check (category in ('beginner','advanced','fat_loss','muscle_gain'))
  default 'beginner';

-- 2. 放开 split 约束，支持 N分化 新值
alter table public.templates
  drop constraint if exists templates_split_check;
alter table public.templates
  add constraint templates_split_check
  check (split in (
    '2split','3split','4split','5split','full_body',
    'upper','lower','full','push','pull','legs','cardio'
  ));

-- 3. 清除旧种子数据
delete from public.templates where user_id is null;

-- ========================================================================
-- 4. 新种子数据（版本 v2 items 格式）
--    items JSON 结构：{ "version": 2, "days": [ { "day": N, "name": "...", "exercises": [...] } ] }
--    exercise 结构：{ "id", "name", "type": "strength"|"cardio", "sets"?, "reps"?, "duration_min"? }
-- ========================================================================

insert into public.templates (user_id, name, level, category, split, items) values

-- ─── 新手 ───────────────────────────────────────────────────────────────

(null, '全身入门 · 二分化', 'beginner', 'beginner', '2split', '{
  "version": 2,
  "days": [
    {
      "day": 1,
      "name": "全身训练 A",
      "exercises": [
        {"id":"goblet_squat",   "name":"酒杯深蹲",   "type":"strength","sets":3,"reps":"10"},
        {"id":"pushup",         "name":"俯卧撑",     "type":"strength","sets":3,"reps":"10"},
        {"id":"db_row",         "name":"哑铃划船",   "type":"strength","sets":3,"reps":"10"},
        {"id":"db_shoulder_press","name":"哑铃推举", "type":"strength","sets":3,"reps":"10"},
        {"id":"plank",          "name":"平板支撑",   "type":"strength","sets":3,"reps":"30"}
      ]
    },
    {
      "day": 2,
      "name": "全身训练 B",
      "exercises": [
        {"id":"db_romanian_dl", "name":"罗马尼亚硬拉","type":"strength","sets":3,"reps":"10"},
        {"id":"lat_pulldown",   "name":"高位下拉",   "type":"strength","sets":3,"reps":"10"},
        {"id":"hammer_curl",    "name":"锤式弯举",   "type":"strength","sets":3,"reps":"12"},
        {"id":"tricep_pushdown","name":"绳索下压",   "type":"strength","sets":3,"reps":"12"},
        {"id":"crunch",         "name":"卷腹",       "type":"strength","sets":3,"reps":"15"}
      ]
    }
  ]
}'::jsonb),

(null, '分部位入门 · 三分化', 'beginner', 'beginner', '3split', '{
  "version": 2,
  "days": [
    {
      "day": 1,
      "name": "胸 · 三头",
      "exercises": [
        {"id":"pushup",         "name":"俯卧撑",     "type":"strength","sets":3,"reps":"12"},
        {"id":"db_fly",         "name":"哑铃飞鸟",   "type":"strength","sets":3,"reps":"12"},
        {"id":"tricep_pushdown","name":"绳索下压",   "type":"strength","sets":3,"reps":"12"},
        {"id":"tricep_dip",     "name":"双杠臂屈伸", "type":"strength","sets":3,"reps":"8"}
      ]
    },
    {
      "day": 2,
      "name": "背 · 二头",
      "exercises": [
        {"id":"lat_pulldown",   "name":"高位下拉",   "type":"strength","sets":3,"reps":"10"},
        {"id":"db_row",         "name":"哑铃划船",   "type":"strength","sets":3,"reps":"10"},
        {"id":"db_curl",        "name":"哑铃弯举",   "type":"strength","sets":3,"reps":"12"},
        {"id":"hammer_curl",    "name":"锤式弯举",   "type":"strength","sets":3,"reps":"12"}
      ]
    },
    {
      "day": 3,
      "name": "腿 · 肩",
      "exercises": [
        {"id":"goblet_squat",         "name":"酒杯深蹲",       "type":"strength","sets":3,"reps":"12"},
        {"id":"bulgarian_split_squat","name":"保加利亚分腿蹲", "type":"strength","sets":3,"reps":"10"},
        {"id":"lateral_raise",        "name":"侧平举",         "type":"strength","sets":3,"reps":"15"},
        {"id":"db_shoulder_press",    "name":"哑铃推举",       "type":"strength","sets":3,"reps":"10"}
      ]
    }
  ]
}'::jsonb),

-- ─── 进阶 ───────────────────────────────────────────────────────────────

(null, '推拉腿 PPL · 三分化', 'intermediate', 'advanced', '3split', '{
  "version": 2,
  "days": [
    {
      "day": 1,
      "name": "推（胸 · 肩 · 三头）",
      "exercises": [
        {"id":"bench_press",       "name":"卧推",         "type":"strength","sets":4,"reps":"6-8"},
        {"id":"incline_db_press",  "name":"上斜哑铃推举", "type":"strength","sets":3,"reps":"8-10"},
        {"id":"db_shoulder_press", "name":"哑铃推举",     "type":"strength","sets":3,"reps":"8-10"},
        {"id":"lateral_raise",     "name":"侧平举",       "type":"strength","sets":3,"reps":"12-15"},
        {"id":"tricep_pushdown",   "name":"绳索下压",     "type":"strength","sets":3,"reps":"10-12"}
      ]
    },
    {
      "day": 2,
      "name": "拉（背 · 二头）",
      "exercises": [
        {"id":"deadlift",      "name":"硬拉",       "type":"strength","sets":4,"reps":"5"},
        {"id":"lat_pulldown",  "name":"高位下拉",   "type":"strength","sets":4,"reps":"8-10"},
        {"id":"barbell_row",   "name":"杠铃划船",   "type":"strength","sets":3,"reps":"8-10"},
        {"id":"barbell_curl",  "name":"杠铃弯举",   "type":"strength","sets":3,"reps":"10-12"},
        {"id":"hammer_curl",   "name":"锤式弯举",   "type":"strength","sets":3,"reps":"10-12"}
      ]
    },
    {
      "day": 3,
      "name": "腿（股四 · 腘绳 · 小腿）",
      "exercises": [
        {"id":"back_squat",           "name":"深蹲",             "type":"strength","sets":4,"reps":"6-8"},
        {"id":"leg_press",            "name":"腿举",             "type":"strength","sets":3,"reps":"10-12"},
        {"id":"leg_curl",             "name":"腿弯举",           "type":"strength","sets":3,"reps":"10-12"},
        {"id":"bulgarian_split_squat","name":"保加利亚分腿蹲",   "type":"strength","sets":3,"reps":"8-10"},
        {"id":"calf_raise",           "name":"提踵",             "type":"strength","sets":4,"reps":"15"}
      ]
    }
  ]
}'::jsonb),

(null, '上下肢交替 · 四分化', 'intermediate', 'advanced', '4split', '{
  "version": 2,
  "days": [
    {
      "day": 1,
      "name": "上肢 A（胸 · 肩）",
      "exercises": [
        {"id":"bench_press",       "name":"卧推",         "type":"strength","sets":4,"reps":"6-8"},
        {"id":"incline_db_press",  "name":"上斜哑铃推举", "type":"strength","sets":3,"reps":"8-10"},
        {"id":"db_shoulder_press", "name":"哑铃推举",     "type":"strength","sets":3,"reps":"8-10"},
        {"id":"lateral_raise",     "name":"侧平举",       "type":"strength","sets":3,"reps":"12-15"},
        {"id":"face_pull",         "name":"面拉",         "type":"strength","sets":3,"reps":"15"}
      ]
    },
    {
      "day": 2,
      "name": "下肢 A（股四 · 小腿）",
      "exercises": [
        {"id":"back_squat",           "name":"深蹲",           "type":"strength","sets":4,"reps":"6-8"},
        {"id":"leg_press",            "name":"腿举",           "type":"strength","sets":3,"reps":"10-12"},
        {"id":"leg_extension",        "name":"腿屈伸",         "type":"strength","sets":3,"reps":"12-15"},
        {"id":"bulgarian_split_squat","name":"保加利亚分腿蹲", "type":"strength","sets":3,"reps":"8-10"},
        {"id":"calf_raise",           "name":"提踵",           "type":"strength","sets":4,"reps":"15"}
      ]
    },
    {
      "day": 3,
      "name": "上肢 B（背 · 手臂）",
      "exercises": [
        {"id":"deadlift",        "name":"硬拉",     "type":"strength","sets":3,"reps":"5"},
        {"id":"lat_pulldown",    "name":"高位下拉", "type":"strength","sets":4,"reps":"8-10"},
        {"id":"barbell_row",     "name":"杠铃划船", "type":"strength","sets":3,"reps":"8-10"},
        {"id":"barbell_curl",    "name":"杠铃弯举", "type":"strength","sets":3,"reps":"10-12"},
        {"id":"tricep_pushdown", "name":"绳索下压", "type":"strength","sets":3,"reps":"10-12"}
      ]
    },
    {
      "day": 4,
      "name": "下肢 B（腘绳 · 臀）",
      "exercises": [
        {"id":"db_romanian_dl",  "name":"罗马尼亚硬拉", "type":"strength","sets":4,"reps":"8-10"},
        {"id":"leg_curl",        "name":"腿弯举",       "type":"strength","sets":3,"reps":"10-12"},
        {"id":"hip_thrust",      "name":"臀桥推举",     "type":"strength","sets":3,"reps":"12-15"},
        {"id":"hanging_leg_raise","name":"悬挂举腿",    "type":"strength","sets":3,"reps":"12"}
      ]
    }
  ]
}'::jsonb),

(null, '经典五分化', 'advanced', 'advanced', '5split', '{
  "version": 2,
  "days": [
    {
      "day": 1,
      "name": "胸",
      "exercises": [
        {"id":"bench_press",      "name":"卧推",         "type":"strength","sets":4,"reps":"6-8"},
        {"id":"incline_db_press", "name":"上斜哑铃推举", "type":"strength","sets":3,"reps":"8-10"},
        {"id":"decline_press",    "name":"下斜卧推",     "type":"strength","sets":3,"reps":"8-10"},
        {"id":"db_fly",           "name":"哑铃飞鸟",     "type":"strength","sets":3,"reps":"12"},
        {"id":"cable_fly",        "name":"绳索夹胸",     "type":"strength","sets":3,"reps":"12-15"}
      ]
    },
    {
      "day": 2,
      "name": "背",
      "exercises": [
        {"id":"deadlift",    "name":"硬拉",     "type":"strength","sets":4,"reps":"5"},
        {"id":"pullup",      "name":"引体向上", "type":"strength","sets":4,"reps":"6-8"},
        {"id":"barbell_row", "name":"杠铃划船", "type":"strength","sets":4,"reps":"8"},
        {"id":"cable_row",   "name":"绳索划船", "type":"strength","sets":3,"reps":"10-12"},
        {"id":"face_pull",   "name":"面拉",     "type":"strength","sets":3,"reps":"15"}
      ]
    },
    {
      "day": 3,
      "name": "肩",
      "exercises": [
        {"id":"db_shoulder_press","name":"哑铃推举",   "type":"strength","sets":4,"reps":"8-10"},
        {"id":"lateral_raise",    "name":"侧平举",     "type":"strength","sets":4,"reps":"12-15"},
        {"id":"front_raise",      "name":"前平举",     "type":"strength","sets":3,"reps":"12"},
        {"id":"rear_delt_fly",    "name":"俯身飞鸟",   "type":"strength","sets":3,"reps":"12-15"},
        {"id":"face_pull",        "name":"面拉",       "type":"strength","sets":3,"reps":"15"}
      ]
    },
    {
      "day": 4,
      "name": "手臂",
      "exercises": [
        {"id":"barbell_curl",        "name":"杠铃弯举",     "type":"strength","sets":4,"reps":"8-10"},
        {"id":"db_curl",             "name":"哑铃弯举",     "type":"strength","sets":3,"reps":"10-12"},
        {"id":"hammer_curl",         "name":"锤式弯举",     "type":"strength","sets":3,"reps":"10-12"},
        {"id":"skullcrusher",        "name":"颅骨破碎者",   "type":"strength","sets":4,"reps":"8-10"},
        {"id":"tricep_pushdown",     "name":"绳索下压",     "type":"strength","sets":3,"reps":"10-12"},
        {"id":"overhead_tricep_ext", "name":"过头三头伸展", "type":"strength","sets":3,"reps":"10-12"}
      ]
    },
    {
      "day": 5,
      "name": "腿",
      "exercises": [
        {"id":"back_squat",  "name":"深蹲",     "type":"strength","sets":4,"reps":"6-8"},
        {"id":"leg_press",   "name":"腿举",     "type":"strength","sets":4,"reps":"10-12"},
        {"id":"leg_extension","name":"腿屈伸",  "type":"strength","sets":3,"reps":"12-15"},
        {"id":"leg_curl",    "name":"腿弯举",   "type":"strength","sets":3,"reps":"10-12"},
        {"id":"hip_thrust",  "name":"臀桥推举", "type":"strength","sets":3,"reps":"12-15"},
        {"id":"calf_raise",  "name":"提踵",     "type":"strength","sets":4,"reps":"15"}
      ]
    }
  ]
}'::jsonb),

-- ─── 减脂 ───────────────────────────────────────────────────────────────

(null, '力量 + 有氧减脂 · 三分化', 'intermediate', 'fat_loss', '3split', '{
  "version": 2,
  "days": [
    {
      "day": 1,
      "name": "全身力量",
      "exercises": [
        {"id":"back_squat",        "name":"深蹲",     "type":"strength","sets":3,"reps":"12"},
        {"id":"bench_press",       "name":"卧推",     "type":"strength","sets":3,"reps":"12"},
        {"id":"barbell_row",       "name":"杠铃划船", "type":"strength","sets":3,"reps":"12"},
        {"id":"db_shoulder_press", "name":"哑铃推举", "type":"strength","sets":3,"reps":"12"},
        {"id":"treadmill_run",     "name":"跑步",     "type":"cardio",  "sets":1,"duration_min":20}
      ]
    },
    {
      "day": 2,
      "name": "HIIT 有氧",
      "exercises": [
        {"id":"jump_rope",    "name":"跳绳",      "type":"cardio","sets":1,"duration_min":15},
        {"id":"hiit",         "name":"HIIT 训练", "type":"cardio","sets":1,"duration_min":20},
        {"id":"brisk_walk",   "name":"快走（放松）","type":"cardio","sets":1,"duration_min":10}
      ]
    },
    {
      "day": 3,
      "name": "上肢力量 + 有氧",
      "exercises": [
        {"id":"lat_pulldown",    "name":"高位下拉", "type":"strength","sets":3,"reps":"12"},
        {"id":"db_shoulder_press","name":"哑铃推举","type":"strength","sets":3,"reps":"12"},
        {"id":"tricep_pushdown", "name":"绳索下压", "type":"strength","sets":3,"reps":"12"},
        {"id":"db_curl",         "name":"哑铃弯举", "type":"strength","sets":3,"reps":"12"},
        {"id":"cycling",         "name":"骑行",     "type":"cardio",  "sets":1,"duration_min":20}
      ]
    }
  ]
}'::jsonb)

on conflict do nothing;
