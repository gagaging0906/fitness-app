export type ExerciseType = "strength" | "cardio";

export interface Exercise {
  id: string;
  name: string;       // 中文名
  group: string;      // 肌肉群（中文）
  type: ExerciseType;
  met?: number;       // 有氧专用，用于热量计算
  defaultSets?: number;
  defaultReps?: string;       // 如 "8-10"
  defaultDurationMin?: number; // 有氧默认时长（分钟）
}

// ─────────────────────────────────────────
// 动作库
// ─────────────────────────────────────────

export const EXERCISES: Exercise[] = [
  // 胸部
  { id: "bench_press",      name: "卧推",           group: "胸部",    type: "strength", defaultSets: 4, defaultReps: "6-8" },
  { id: "incline_db_press", name: "上斜哑铃推举",   group: "胸部",    type: "strength", defaultSets: 3, defaultReps: "8-10" },
  { id: "decline_press",    name: "下斜卧推",        group: "胸部",    type: "strength", defaultSets: 3, defaultReps: "8-10" },
  { id: "cable_fly",        name: "绳索夹胸",        group: "胸部",    type: "strength", defaultSets: 3, defaultReps: "12-15" },
  { id: "db_fly",           name: "哑铃飞鸟",        group: "胸部",    type: "strength", defaultSets: 3, defaultReps: "12" },
  { id: "pushup",           name: "俯卧撑",          group: "胸部",    type: "strength", defaultSets: 3, defaultReps: "12" },

  // 背部
  { id: "deadlift",         name: "硬拉",            group: "背部",    type: "strength", defaultSets: 4, defaultReps: "5" },
  { id: "lat_pulldown",     name: "高位下拉",        group: "背部",    type: "strength", defaultSets: 4, defaultReps: "8-10" },
  { id: "barbell_row",      name: "杠铃划船",        group: "背部",    type: "strength", defaultSets: 4, defaultReps: "8" },
  { id: "db_row",           name: "哑铃划船",        group: "背部",    type: "strength", defaultSets: 3, defaultReps: "10" },
  { id: "cable_row",        name: "绳索划船",        group: "背部",    type: "strength", defaultSets: 3, defaultReps: "10-12" },
  { id: "pullup",           name: "引体向上",        group: "背部",    type: "strength", defaultSets: 4, defaultReps: "6-8" },
  { id: "face_pull",        name: "面拉",            group: "背部",    type: "strength", defaultSets: 3, defaultReps: "15" },

  // 肩部
  { id: "db_shoulder_press", name: "哑铃推举",       group: "肩部",    type: "strength", defaultSets: 4, defaultReps: "8-10" },
  { id: "lateral_raise",     name: "侧平举",         group: "肩部",    type: "strength", defaultSets: 3, defaultReps: "12-15" },
  { id: "front_raise",       name: "前平举",         group: "肩部",    type: "strength", defaultSets: 3, defaultReps: "12" },
  { id: "rear_delt_fly",     name: "俯身飞鸟",       group: "肩部",    type: "strength", defaultSets: 3, defaultReps: "12-15" },
  { id: "arnold_press",      name: "阿诺德推举",     group: "肩部",    type: "strength", defaultSets: 3, defaultReps: "8-10" },

  // 二头肌
  { id: "barbell_curl",     name: "杠铃弯举",        group: "二头肌",  type: "strength", defaultSets: 4, defaultReps: "8-10" },
  { id: "db_curl",          name: "哑铃弯举",        group: "二头肌",  type: "strength", defaultSets: 3, defaultReps: "10-12" },
  { id: "hammer_curl",      name: "锤式弯举",        group: "二头肌",  type: "strength", defaultSets: 3, defaultReps: "10-12" },

  // 三头肌
  { id: "tricep_pushdown",      name: "绳索下压",         group: "三头肌",  type: "strength", defaultSets: 3, defaultReps: "10-12" },
  { id: "skullcrusher",         name: "颅骨破碎者",       group: "三头肌",  type: "strength", defaultSets: 4, defaultReps: "8-10" },
  { id: "tricep_dip",           name: "双杠臂屈伸",       group: "三头肌",  type: "strength", defaultSets: 3, defaultReps: "8" },
  { id: "overhead_tricep_ext",  name: "过头三头伸展",     group: "三头肌",  type: "strength", defaultSets: 3, defaultReps: "10-12" },

  // 腿部
  { id: "back_squat",           name: "深蹲",             group: "腿部",    type: "strength", defaultSets: 4, defaultReps: "6-8" },
  { id: "leg_press",            name: "腿举",             group: "腿部",    type: "strength", defaultSets: 3, defaultReps: "10-12" },
  { id: "leg_extension",        name: "腿屈伸",           group: "腿部",    type: "strength", defaultSets: 3, defaultReps: "12-15" },
  { id: "leg_curl",             name: "腿弯举",           group: "腿部",    type: "strength", defaultSets: 3, defaultReps: "10-12" },
  { id: "db_romanian_dl",       name: "罗马尼亚硬拉",     group: "腿部",    type: "strength", defaultSets: 4, defaultReps: "8-10" },
  { id: "calf_raise",           name: "提踵",             group: "腿部",    type: "strength", defaultSets: 4, defaultReps: "15" },
  { id: "bulgarian_split_squat",name: "保加利亚分腿蹲",   group: "腿部",    type: "strength", defaultSets: 3, defaultReps: "8-10" },
  { id: "hip_thrust",           name: "臀桥推举",         group: "腿部",    type: "strength", defaultSets: 3, defaultReps: "12-15" },
  { id: "goblet_squat",         name: "酒杯深蹲",         group: "腿部",    type: "strength", defaultSets: 3, defaultReps: "10" },

  // 核心
  { id: "plank",              name: "平板支撑",     group: "核心",    type: "strength", defaultSets: 3, defaultReps: "30" },
  { id: "crunch",             name: "卷腹",         group: "核心",    type: "strength", defaultSets: 3, defaultReps: "15" },
  { id: "hanging_leg_raise",  name: "悬挂举腿",     group: "核心",    type: "strength", defaultSets: 3, defaultReps: "12" },
  { id: "russian_twist",      name: "俄式转体",     group: "核心",    type: "strength", defaultSets: 3, defaultReps: "20" },
  { id: "dead_bug",           name: "死虫子",       group: "核心",    type: "strength", defaultSets: 3, defaultReps: "12" },

  // 有氧
  { id: "treadmill_run",  name: "跑步",     group: "有氧", type: "cardio", met: 8.0,  defaultDurationMin: 20 },
  { id: "brisk_walk",     name: "快走",     group: "有氧", type: "cardio", met: 3.5,  defaultDurationMin: 30 },
  { id: "cycling",        name: "骑行",     group: "有氧", type: "cardio", met: 7.0,  defaultDurationMin: 20 },
  { id: "jump_rope",      name: "跳绳",     group: "有氧", type: "cardio", met: 10.0, defaultDurationMin: 15 },
  { id: "rowing_machine", name: "划船机",   group: "有氧", type: "cardio", met: 7.0,  defaultDurationMin: 20 },
  { id: "hiit",           name: "HIIT 训练",group: "有氧", type: "cardio", met: 9.0,  defaultDurationMin: 20 },
  { id: "stair_climber",  name: "楼梯机",   group: "有氧", type: "cardio", met: 8.0,  defaultDurationMin: 20 },
  { id: "elliptical",     name: "椭圆机",   group: "有氧", type: "cardio", met: 5.0,  defaultDurationMin: 25 },
];

// ─────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────

/** 按 id 快速查找 */
export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e])
);

/** 获取某肌群的动作列表 */
export function getByGroup(group: string): Exercise[] {
  return EXERCISES.filter((e) => e.group === group);
}

/** 所有肌群（保持顺序） */
export const GROUPS = ["胸部", "背部", "肩部", "二头肌", "三头肌", "腿部", "核心", "有氧"] as const;
