export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType = "lose" | "maintain" | "gain";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MacroGoals {
  proteinG: number;
  fatG: number;
  carbG: number;
}

export interface Profile {
  name: string;
  dob: string; // YYYY-MM-DD
  sex: Sex;
  heightCm: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  weeklyRateKg: number; // positive number, direction implied by goalType
  dailyCalorieGoal: number;
  macroGoals: MacroGoals;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeightLog {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPct?: number;
  note?: string;
  createdAt?: string;
}

// Nutrient values are all per the food's defined serving (Food) or
// already scaled to the logged quantity (FoodLog).
export interface Nutrients {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  sugar?: number;
  sodium?: number; // mg
  [micronutrient: string]: number | undefined;
}

export interface Food {
  id: string;
  name: string;
  source: "usda" | "custom";
  fdcId?: number;
  servingSize: number;
  servingUnit: string;
  nutrients: Nutrients; // per one serving (servingSize servingUnit)
  createdAt?: string;
}

export interface FoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodId: string;
  foodName: string;
  quantity: number; // number of servings
  unit: string;
  nutrients: Nutrients; // already scaled by quantity
  createdAt?: string;
}

export interface UsdaSearchResultItem {
  fdcId: number;
  description: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
}
