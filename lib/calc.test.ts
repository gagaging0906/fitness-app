import { describe, it, expect } from "vitest";
import {
  calcBMR, calcTDEE, detectGoal, calcDailyTarget,
  calcBurnKcal, getProgression, calcWeeklyScore, calcMacros,
  kcalToFriendly,
} from "./calc";

describe("BMR", () => {
  it("男性标准案例", () => {
    // 男 25 岁 175cm 70kg → 10×70 + 6.25×175 − 5×25 + 5 = 700+1093.75-125+5 = 1673.75 → 1674
    expect(calcBMR({ gender: "male", age: 25, height: 175, weight: 70, weight_target: 70 })).toBe(1674);
  });
  it("女性标准案例", () => {
    // 女 25 岁 165cm 55kg → 550+1031.25-125-161 = 1295.25 → 1295
    expect(calcBMR({ gender: "female", age: 25, height: 165, weight: 55, weight_target: 55 })).toBe(1295);
  });
  it("越界年龄应抛错", () => {
    expect(() => calcBMR({ gender: "male", age: 10, height: 175, weight: 70, weight_target: 70 }))
      .toThrow("AGE_OUT_OF_RANGE");
  });
  it("越界身高应抛错", () => {
    expect(() => calcBMR({ gender: "male", age: 25, height: 50, weight: 70, weight_target: 70 }))
      .toThrow("HEIGHT_OUT_OF_RANGE");
  });
  it("越界体重应抛错", () => {
    expect(() => calcBMR({ gender: "female", age: 25, height: 165, weight: 10, weight_target: 55 }))
      .toThrow("WEIGHT_OUT_OF_RANGE");
  });
  it("非法性别应抛错", () => {
    // @ts-expect-error 测试非法值
    expect(() => calcBMR({ gender: "x", age: 25, height: 165, weight: 55, weight_target: 55 }))
      .toThrow("INVALID_GENDER");
  });
});

describe("TDEE", () => {
  it("久坐 1.2", () => expect(calcTDEE(1500, "sedentary")).toBe(1800));
  it("轻度 1.375", () => expect(calcTDEE(1500, "light")).toBe(2063));
  it("中度 1.55", () => expect(calcTDEE(2000, "moderate")).toBe(3100));
  it("高强度 1.725", () => expect(calcTDEE(1600, "active")).toBe(2760));
  it("极高 1.9", () => expect(calcTDEE(1800, "very_active")).toBe(3420));
});

describe("detectGoal", () => {
  it("减脂", () => expect(detectGoal(70, 62)).toBe("cut"));
  it("增肌", () => expect(detectGoal(60, 65)).toBe("bulk"));
  it("维持（< 0.5 差距）", () => expect(detectGoal(70, 70.2)).toBe("maintain"));
});

describe("calcDailyTarget", () => {
  it("男减脂 标准档", () => {
    const r = calcDailyTarget({
      gender: "male", age: 25, height: 175,
      weight: 80, weight_target: 70,
      activity: "light", speed: "standard",
    });
    expect(r.goal).toBe("cut");
    expect(r.delta).toBe(-500);
    expect(r.target_kcal).toBeGreaterThan(1500);
    expect(r.adjusted).toBe(false);
  });
  it("女激进减脂 应被安全下限上调", () => {
    const r = calcDailyTarget({
      gender: "female", age: 40, height: 155,
      weight: 50, weight_target: 45,
      activity: "sedentary", speed: "aggressive",
    });
    expect(r.goal).toBe("cut");
    expect(r.adjusted).toBe(true);
    expect(r.target_kcal).toBeGreaterThanOrEqual(1200);
  });
  it("增肌 标准档 +300", () => {
    const r = calcDailyTarget({
      gender: "male", age: 25, height: 180,
      weight: 70, weight_target: 75,
      activity: "moderate", speed: "standard",
    });
    expect(r.goal).toBe("bulk");
    expect(r.delta).toBe(300);
  });
  it("维持 delta 为 0", () => {
    const r = calcDailyTarget({
      gender: "female", age: 30, height: 165,
      weight: 55, weight_target: 55,
    });
    expect(r.goal).toBe("maintain");
    expect(r.delta).toBe(0);
  });
});

describe("calcMacros", () => {
  it("减脂 蛋白 1.6g/kg", () => {
    const m = calcMacros(1800, 70, "cut");
    expect(m.protein_g).toBe(112);
    expect(m.fat_g).toBe(50);
    expect(m.carb_g).toBeGreaterThan(0);
  });
  it("增肌 蛋白 2.0g/kg", () => {
    const m = calcMacros(2800, 70, "bulk");
    expect(m.protein_g).toBe(140);
  });
});

describe("calcBurnKcal", () => {
  it("力量训练 70kg 60min", () => expect(calcBurnKcal(5.5, 70, 60)).toBe(385));
  it("0/负数返回 0", () => {
    expect(calcBurnKcal(0, 70, 60)).toBe(0);
    expect(calcBurnKcal(5, -10, 60)).toBe(0);
  });
});

describe("getProgression", () => {
  it("RIR>=2 增重 下肢 +2.5kg", () => {
    const r = getProgression([{ weight: 60, reps: 10, rir: 2 }], "squat");
    expect(r.action).toBe("increase");
    expect(r.new_weight).toBe(62.5);
  });
  it("RIR>=2 增重 上肢 +1.25kg", () => {
    const r = getProgression([{ weight: 40, reps: 10, rir: 3 }], "bench_press");
    expect(r.action).toBe("increase");
    expect(r.new_weight).toBe(41.25);
  });
  it("RIR=1 维持", () => {
    const r = getProgression([{ weight: 60, reps: 10, rir: 1 }], "squat");
    expect(r.action).toBe("maintain");
  });
  it("RIR=0 首次维持", () => {
    const r = getProgression([{ weight: 60, reps: 10, rir: 0 }], "squat", 0);
    expect(r.action).toBe("maintain");
  });
  it("RIR=0 连续 2 次 deload", () => {
    const r = getProgression([{ weight: 60, reps: 10, rir: 0 }], "squat", 2);
    expect(r.action).toBe("deload");
    expect(r.new_weight).toBe(57);
  });
  it("空 sets 首次训练", () => {
    const r = getProgression([], "squat");
    expect(r.action).toBe("maintain");
  });
});

describe("calcWeeklyScore", () => {
  it("满分周", () => {
    const s = calcWeeklyScore({ kcal_achieve_rate: 1, workout_days: 4, weight_delta: -0.3, goal: "cut" });
    expect(s).toBe(100);
  });
  it("零输入保底 10 分", () => {
    const s = calcWeeklyScore({ kcal_achieve_rate: 0, workout_days: 0, weight_delta: 2, goal: "cut" });
    expect(s).toBeGreaterThanOrEqual(10);
  });
});

describe("kcalToFriendly", () => {
  it("正常返回米饭换算", () => {
    expect(kcalToFriendly(460)).toContain("碗米饭");
  });
  it("小热量返回鸡蛋", () => {
    expect(kcalToFriendly(100)).toContain("鸡蛋");
  });
  it("0 返回占位", () => {
    expect(kcalToFriendly(0)).toBe("—");
  });
});
