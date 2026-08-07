import type { Food, MacroGoals, Nutrients } from "@/types";
import { getNutrientAdvice } from "@/lib/suggestions";

export default function NutrientAdvice({
  totals,
  calorieGoal,
  macroGoals,
  foods,
}: {
  totals: Nutrients;
  calorieGoal: number;
  macroGoals: MacroGoals;
  foods: Food[];
}) {
  const advice = getNutrientAdvice(totals, calorieGoal, macroGoals, foods);

  if (advice.gaps.length === 0 && !advice.overCalories) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        You&apos;re on track — calories and macros are all close to goal.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Suggestions</h2>

      {advice.overCalories && (
        <p className="text-sm text-red-600">
          {Math.round(-advice.caloriesRemaining)} kcal over goal — go lighter on the rest of the
          day if you can.
        </p>
      )}

      {advice.suggestionsByMacro.map(({ gap, suggestions }) => (
        <div key={gap.key} className="text-sm">
          <p className="text-gray-600">
            {Math.round(gap.remaining)}g short on <span className="font-medium">{gap.label}</span>
            {suggestions.length > 0 ? " — try:" : "."}
          </p>
          {suggestions.length > 0 && (
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-gray-500">
              {suggestions.map((s) => (
                <li key={s.food.id}>
                  {s.food.name}{" "}
                  <span className="text-xs text-gray-400">({s.reason})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {advice.gaps
        .filter((g) => g.remaining < 0)
        .map((g) => (
          <p key={g.key} className="text-sm text-amber-600">
            {Math.round(-g.remaining)}g over on {g.label} — ease up on foods high in it for the
            rest of the day.
          </p>
        ))}
    </div>
  );
}
