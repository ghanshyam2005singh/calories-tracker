import type { MacroGoals, Nutrients } from "@/types";

function Bar({
  label,
  value,
  goal,
  unit,
  colorClass,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  colorClass: string;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span>
          {Math.round(value)} / {Math.round(goal)}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MacroSummary({
  totals,
  calorieGoal,
  macroGoals,
}: {
  totals: Nutrients;
  calorieGoal: number;
  macroGoals: MacroGoals;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <Bar
        label="Calories"
        value={totals.calories}
        goal={calorieGoal}
        unit=" kcal"
        colorClass="bg-gray-900"
      />
      <Bar
        label="Protein"
        value={totals.protein}
        goal={macroGoals.proteinG}
        unit="g"
        colorClass="bg-blue-500"
      />
      <Bar
        label="Fat"
        value={totals.fat}
        goal={macroGoals.fatG}
        unit="g"
        colorClass="bg-amber-500"
      />
      <Bar
        label="Carbs"
        value={totals.carbs}
        goal={macroGoals.carbG}
        unit="g"
        colorClass="bg-emerald-500"
      />
    </div>
  );
}
