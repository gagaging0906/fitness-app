/**
 * 核心算法库：BMR / TDEE / 每日热量目标 / 训练消耗 / 渐进式超负荷
 * 公式与边界规则详见《核心算法说明.md》
 */

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalSpeed = "mild" | "standard" | "aggressive";
export type Goal = "cut" | "bulk" | "maintain";

export interface Profile {
  gender: Gender;
  age: number;
  height: number;      // cm
  weight: number;      // kg
  weight_target: number; // kg
  activity?: ActivityLevel;
  speed?: GoalSpeed;
}

export interface DailyTarget {
  bmr: number;
  tdee: number;
  goal: Goal;
  delta: number;          // 相对 TDEE 的盈余/缺口（正负）
  target_kcal: number;    // 今日建议摄入
  adjusted: boolean;      // 若被安全下限上调过，true
  macros: { protein_g: number; fat_g: number; carb_g: number };
  notes?: string[];       // 提示文案（如目标过激、已触发安全下限等）
}

// ---------- BMR (Mifflin-St Jeor) ----------
export function calcBMR({ gender, age, height, weight }: Profile): number {
  if (!["male", "female"].includes(gender)) throw new Error("INVALID_GENDER");
  if (age < 14 || age > 80) throw new Error("AGE_OUT_OF_RANGE");
  if (height < 120 || height > 220) throw new Error("HEIGHT_OUT_OF_RANGE");
  if (weight < 30 || weight > 200) throw new Error("WEIGHT_OUT_OF_RANGE");

  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

// ---------- TDEE ----------
export const ACTIVITY_COEF: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTDEE(bmr: number, activity: ActivityLevel = "light"): number {
  const coef = ACTIVITY_COEF[activity];
  if (!coef) throw new Error("INVALID_ACTIVITY");
  return Math.round(bmr * coef);
}

// ---------- 目标判定 ----------
export function detectGoal(weight: number, weight_target: number): Goal {
  const diff = weight_target - weight;
  if (diff < -0.5) return "cut";
  if (diff > 0.5) return "bulk";
  return "maintain";
}

// ---------- 每日目标 ----------
const CUT_DELTA: Record<GoalSpeed, number> = { mild: -300, standard: -500, aggressive: -750 };
const BULK_DELTA: Record<GoalSpeed, number> = { mild: 200, standard: 300, aggressive: 500 };

export function calcDailyTarget(profile: Profile): DailyTarget {
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(bmr, profile.activity ?? "light");
  const goal = detectGoal(profile.weight, profile.weight_target);
  const speed: GoalSpeed = profile.speed ?? "standard";

  let delta = 0;
  if (goal === "cut") delta = CUT_DELTA[speed];
  else if (goal === "bulk") delta = BULK_DELTA[speed];

  let target = tdee + delta;
  const floor = profile.gender === "male" ? 1500 : 1200;
  const safeFloor = Math.max(bmr, floor);
  const adjusted = target < safeFloor;
  if (adjusted) target = safeFloor;

  const notes: string[] = [];
  if (adjusted) notes.push("目标热量低于安全下限，已自动调整");
  if (goal === "cut" && Math.abs(delta) > 600) notes.push("每日缺口较大，建议循序渐进");
  if (goal === "bulk" && delta > 400) notes.push("盈余较高，注意控制体脂增长");

  return {
    bmr,
    tdee,
    goal,
    delta,
    target_kcal: target,
    adjusted,
    macros: calcMacros(target, profile.weight, goal),
    notes: notes.length ? notes : undefined,
  };
}

// ---------- 宏量营养素 ----------
export function calcMacros(target_kcal: number, weight: number, goal: Goal) {
  const protein_g = Math.round(weight * (goal === "bulk" ? 2.0 : 1.6));
  const fat_g = Math.round((target_kcal * 0.25) / 9);
  const carb_g = Math.max(0, Math.round((target_kcal - protein_g * 4 - fat_g * 9) / 4));
  return { protein_g, fat_g, carb_g };
}

// ---------- 训练消耗（MET 法）----------
export function calcBurnKcal(met: number, weight_kg: number, minutes: number): number {
  if (met <= 0 || weight_kg <= 0 || minutes <= 0) return 0;
  return Math.round((met * weight_kg * minutes) / 60);
}

export const MET_MAP: Record<string, number> = {
  // 有氧（按 exercise id 对应）
  treadmill_run: 8.0,
  brisk_walk: 3.5,
  cycling: 7.0,
  jump_rope: 10.0,
  rowing_machine: 7.0,
  hiit: 9.0,
  stair_climber: 8.0,
  elliptical: 5.0,
  // 旧键兼容
  strength: 5.5,
  strength_heavy: 6.0,
  cardio: 6.0,
  running_slow: 6.0,
  running_fast: 10.0,
  yoga: 2.5,
  walking: 3.5,
};

/** 大肌群动作（用于提高消耗估算 MET） */
const COMPOUND_IDS = new Set([
  "deadlift","back_squat","leg_press","barbell_row","bench_press","pullup","hip_thrust",
]);

/**
 * 计算整次训练热量消耗
 * exercises: 按动作分组后的记录数组
 * weightKg:  用户体重
 */
export function calcWorkoutBurn(
  exercises: {
    id: string;
    type: "strength" | "cardio";
    sets: { weight?: number; reps?: number; duration_min?: number }[];
  }[],
  weightKg: number
): number {
  let total = 0;
  for (const ex of exercises) {
    if (ex.type === "cardio") {
      const totalMin = ex.sets.reduce((s, set) => s + (set.duration_min ?? 0), 0);
      if (totalMin > 0) {
        const met = MET_MAP[ex.id] ?? 6.0;
        total += calcBurnKcal(met, weightKg, totalMin);
      }
    } else {
      // 力量：每组约 45s 实际发力时间，复合动作 MET 6.0，孤立动作 5.0
      const met = COMPOUND_IDS.has(ex.id) ? 6.0 : 5.0;
      const totalMin = ex.sets.length * 0.75;
      total += calcBurnKcal(met, weightKg, totalMin);
    }
  }
  return total;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  rir?: number; // reps in reserve
}
export interface Workout {
  type: keyof typeof MET_MAP | string;
  duration_sec: number;
  sets?: WorkoutSet[];
  consecutive_zero_rir?: number;
}

export function estimateWorkoutBurn(w: Workout, weight_kg: number): number {
  const met = MET_MAP[w.type] ?? 5.0;
  return calcBurnKcal(met, weight_kg, w.duration_sec / 60);
}

export function totalVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

// ---------- 渐进式超负荷 ----------
const UPPER_BODY = new Set([
  "bench_press", "shoulder_press", "pullup",
  "barbell_row", "bicep_curl", "tricep_ext",
  "lat_pulldown", "incline_press",
]);

export interface ProgressionResult {
  action: "increase" | "maintain" | "deload";
  suggestion: string;
  new_weight?: number;
  new_reps?: number;
  confidence: number;
}

export function getProgression(
  lastSets: WorkoutSet[],
  exerciseId: string,
  consecutive_zero_rir = 0,
): ProgressionResult {
  if (!lastSets.length) {
    return { action: "maintain", suggestion: "首次训练，保守开始", confidence: 0.5 };
  }
  const last = lastSets[lastSets.length - 1];
  const step = UPPER_BODY.has(exerciseId) ? 1.25 : 2.5;
  const rir = last.rir ?? 0;

  if (rir >= 2) {
    return {
      action: "increase",
      suggestion: `+${step}kg 或 +1 次`,
      new_weight: last.weight + step,
      new_reps: last.reps,
      confidence: 0.9,
    };
  }
  if (rir === 1) {
    return { action: "maintain", suggestion: "保持当前重量组数", confidence: 0.8 };
  }
  // rir === 0
  if (consecutive_zero_rir >= 2) {
    return {
      action: "deload",
      suggestion: "减重 5% 恢复一周",
      new_weight: Math.round(last.weight * 0.95 * 2) / 2,
      new_reps: last.reps,
      confidence: 0.7,
    };
  }
  return { action: "maintain", suggestion: "保持，观察身体状态", confidence: 0.6 };
}

// ---------- 周报分数 ----------
export interface WeeklyInput {
  kcal_achieve_rate: number; // 0-1 平均每日达成率
  workout_days: number;
  weight_delta: number;      // kg，正为增
  goal: Goal;
}

export function calcWeeklyScore(i: WeeklyInput): number {
  const kcal = Math.min(1, Math.max(0, i.kcal_achieve_rate)) * 40;
  const workout = Math.min(1, i.workout_days / 4) * 30;
  const weight = goalAligned(i.weight_delta, i.goal) * 20;
  return Math.round(kcal + workout + weight + 10);
}

function goalAligned(delta: number, goal: Goal): number {
  if (goal === "cut") return delta < 0 ? 1 : Math.max(0, 1 + delta);
  if (goal === "bulk") return delta > 0 ? 1 : Math.max(0, 1 - delta);
  return Math.max(0, 1 - Math.abs(delta));
}

// ---------- 小白文案换算 ----------
export function kcalToFriendly(kcal: number): string {
  if (kcal <= 0) return "—";
  const rice = Math.round((kcal / 230) * 10) / 10;  // 一碗米饭 ≈ 230 大卡
  const egg = Math.round(kcal / 75);                 // 一个鸡蛋 ≈ 75 大卡
  if (rice >= 1) return `≈ ${rice} 碗米饭`;
  return `≈ ${egg} 个鸡蛋`;
}
