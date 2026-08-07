import type { Food, MacroGoals, Nutrients } from "@/types";

export type MacroKey = "protein" | "fat" | "carbs";

export interface MacroGap {
  key: MacroKey;
  label: string;
  remaining: number; // goal - consumed; negative means over
}

export interface FoodSuggestion {
  food: Food;
  reason: string;
}

const MACRO_LABELS: Record<MacroKey, string> = {
  protein: "protein",
  fat: "fat",
  carbs: "carbs",
};

const GOAL_KEY: Record<MacroKey, keyof MacroGoals> = {
  protein: "proteinG",
  fat: "fatG",
  carbs: "carbG",
};

// Gaps between what's been eaten and today's goals, largest deficit first.
// A macro only counts as "deficient" once the gap clears a noise threshold
// (5g or 8% of goal, whichever is bigger) so tiny rounding differences
// don't trigger a suggestion.
export function getMacroGaps(totals: Nutrients, macroGoals: MacroGoals): MacroGap[] {
  const keys: MacroKey[] = ["protein", "fat", "carbs"];
  return keys
    .map((key) => {
      const goal = macroGoals[GOAL_KEY[key]];
      const consumed = totals[key] ?? 0;
      return { key, label: MACRO_LABELS[key], remaining: goal - consumed, goal };
    })
    .filter((g) => {
      const threshold = Math.max(5, g.goal * 0.08);
      return Math.abs(g.remaining) >= threshold;
    })
    .sort((a, b) => b.remaining - a.remaining);
}

// For the most-deficient macro, suggest foods from the user's own library
// that deliver it efficiently (high grams-per-calorie) without loading up
// on any macro that's already over goal.
export function suggestFoodsForGap(
  gap: MacroGap,
  foods: Food[],
  surplusMacros: MacroKey[]
): FoodSuggestion[] {
  if (gap.remaining <= 0) return [];

  const scored = foods
    .map((food) => {
      const val = food.nutrients[gap.key] ?? 0;
      const calories = Math.max(food.nutrients.calories, 1);
      if (val <= 0) return null;
      const density = val / calories; // grams of target macro per calorie
      const surplusHit = surplusMacros.reduce(
        (acc, m) => acc + (food.nutrients[m] ?? 0) / calories,
        0
      );
      const score = density - surplusHit * 0.75;
      return { food, score, val };
    })
    .filter((x): x is { food: Food; score: number; val: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map(({ food, val }) => ({
    food,
    reason: `${Math.round(val)}g ${gap.label} per serving`,
  }));
}

export interface NutrientAdvice {
  overCalories: boolean;
  caloriesRemaining: number;
  gaps: MacroGap[];
  suggestionsByMacro: { gap: MacroGap; suggestions: FoodSuggestion[] }[];
}

export function getNutrientAdvice(
  totals: Nutrients,
  calorieGoal: number,
  macroGoals: MacroGoals,
  foods: Food[]
): NutrientAdvice {
  const caloriesRemaining = calorieGoal - totals.calories;
  const gaps = getMacroGaps(totals, macroGoals);
  const surplusMacros = gaps.filter((g) => g.remaining < 0).map((g) => g.key);
  const deficientGaps = gaps.filter((g) => g.remaining > 0);

  const suggestionsByMacro = deficientGaps.slice(0, 2).map((gap) => ({
    gap,
    suggestions: suggestFoodsForGap(gap, foods, surplusMacros),
  }));

  return {
    overCalories: caloriesRemaining < 0,
    caloriesRemaining,
    gaps,
    suggestionsByMacro,
  };
}
