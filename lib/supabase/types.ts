// 与 supabase/schema.sql 对应的最小类型定义
// 后续可用 `supabase gen types typescript` 自动生成覆盖

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Gender = "male" | "female";
export type Goal = "cut" | "bulk" | "maintain";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface Profile {
  user_id: string;
  nickname: string | null;
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  weight_target_kg: number | null;
  activity: Activity;
  goal: Goal;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  target_kcal: number;
  intake_kcal: number;
  burn_kcal: number;
  weight_kg: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  template_id: string | null;
  name: string;
  sets: Json; // [{exerciseId, weight, reps, rir}]
  total_volume: number;
  burn_kcal: number;
  created_at: string;
}

export type TemplateCategory = "beginner" | "advanced" | "fat_loss" | "muscle_gain";
export type TemplateSplit =
  | "2split" | "3split" | "4split" | "5split" | "full_body"
  | "upper" | "lower" | "full" | "push" | "pull" | "legs" | "cardio";

/** v2 items 格式 */
export interface TemplateExercise {
  id: string;
  name: string;
  type: "strength" | "cardio";
  sets?: number;
  reps?: string;
  duration_min?: number;
}
export interface TemplateDay {
  day: number;
  name: string;
  exercises: TemplateExercise[];
}
export interface TemplateDays {
  version: 2;
  days: TemplateDay[];
}

export interface Template {
  id: string;
  user_id: string | null;
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  category: TemplateCategory;
  split: TemplateSplit;
  items: Json; // TemplateDays（v2）
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  items: Json; // [{name, kcal, protein, fat, carb, qty}]
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  photo_url: string | null;
  source: "manual" | "ai_photo" | "ai_recommend";
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  code: string;
  earned_at: string;
  meta: Json;
}

export interface GeneratedPhoto {
  id: string;
  user_id: string;
  kind: "future_body";
  input_url: string;
  output_url: string;
  weeks: number;
  goal: Goal;
  gender: Gender;
  model: string;
  cost_cents: number;
  expires_at: string | null;
  created_at: string;
}

type R = never[];  // Supabase v2 GenericTable 要求 Relationships 字段

export interface Database {
  public: {
    Tables: {
      profiles:          { Row: Profile;        Insert: Partial<Profile>        & Pick<Profile,        "user_id"|"gender"|"age"|"height_cm"|"weight_kg"|"activity"|"goal">;      Update: Partial<Profile>;        Relationships: R };
      daily_logs:        { Row: DailyLog;       Insert: Partial<DailyLog>       & Pick<DailyLog,       "user_id"|"date">;                                                        Update: Partial<DailyLog>;       Relationships: R };
      workouts:          { Row: Workout;        Insert: Partial<Workout>        & Pick<Workout,        "user_id"|"date"|"name"|"sets">;                                          Update: Partial<Workout>;        Relationships: R };
      templates:         { Row: Template;       Insert: Partial<Template>       & Pick<Template,       "name"|"level"|"split"|"items"|"category">;                               Update: Partial<Template>;       Relationships: R };
      meals:             { Row: Meal;           Insert: Partial<Meal>           & Pick<Meal,           "user_id"|"date"|"slot"|"items"|"kcal">;                                  Update: Partial<Meal>;           Relationships: R };
      badges:            { Row: Badge;          Insert: Partial<Badge>          & Pick<Badge,          "user_id"|"code">;                                                        Update: Partial<Badge>;          Relationships: R };
      generated_photos:  { Row: GeneratedPhoto; Insert: Partial<GeneratedPhoto> & Pick<GeneratedPhoto, "user_id"|"kind"|"input_url"|"output_url"|"weeks"|"goal"|"gender"|"model">; Update: Partial<GeneratedPhoto>; Relationships: R };
    };
    Views: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: never[] }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string[]>;
    CompositeTypes: Record<string, unknown>;
  };
}
