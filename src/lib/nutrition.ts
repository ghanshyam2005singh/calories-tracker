import type { ActivityLevel, GoalType, MacroGoals, Nutrients, Sex } from "@/types";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Light (exercise 1-3 days/week)",
  moderate: "Moderate (exercise 3-5 days/week)",
  active: "Active (exercise 6-7 days/week)",
  very_active: "Very active (hard exercise/physical job)",
};

export function calculateAge(dob: string, onDate: Date = new Date()): number {
  const birth = new Date(dob);
  let age = onDate.getFullYear() - birth.getFullYear();
  const m = onDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && onDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Mifflin-St Jeor equation
export function calculateBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

// One kg of body fat is ~7700 kcal.
const KCAL_PER_KG = 7700;

export function suggestDailyCalories(
  tdee: number,
  goalType: GoalType,
  weeklyRateKg: number
): number {
  const dailyDelta = (weeklyRateKg * KCAL_PER_KG) / 7;
  if (goalType === "lose") return Math.round(tdee - dailyDelta);
  if (goalType === "gain") return Math.round(tdee + dailyDelta);
  return Math.round(tdee);
}

// Simple, sane default macro split: 30% protein, 30% fat, 40% carbs.
export function suggestMacroGoals(dailyCalories: number): MacroGoals {
  return {
    proteinG: Math.round((dailyCalories * 0.3) / 4),
    fatG: Math.round((dailyCalories * 0.3) / 9),
    carbG: Math.round((dailyCalories * 0.4) / 4),
  };
}

export function scaleNutrients(nutrients: Nutrients, factor: number): Nutrients {
  const scaled: Nutrients = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  for (const [key, value] of Object.entries(nutrients)) {
    if (typeof value === "number") scaled[key] = value * factor;
  }
  return scaled;
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  const total: Nutrients = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  for (const n of list) {
    for (const [key, value] of Object.entries(n)) {
      if (typeof value === "number") total[key] = (total[key] ?? 0) + value;
    }
  }
  return total;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return todayId(date);
}

export function todayId(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
