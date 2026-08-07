"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NumberInput from "@/components/NumberInput";
import { getProfile } from "@/lib/firestore/profile";
import { listFoods } from "@/lib/firestore/foods";
import { addFoodLog, deleteFoodLog, listFoodLogsForDate } from "@/lib/firestore/foodLogs";
import { getWeightLog, upsertWeightLog } from "@/lib/firestore/weightLogs";
import { addDays, scaleNutrients, sumNutrients, todayId } from "@/lib/nutrition";
import MacroSummary from "@/components/MacroSummary";
import type { Food, FoodLog, MealType, Profile, WeightLog } from "@/types";

const MEALS: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch", label: "Lunch" },
  { type: "dinner", label: "Dinner" },
  { type: "snack", label: "Snacks" },
];

const DEFAULT_MACRO_GOALS = { proteinG: 150, fatG: 65, carbG: 200 };

function DiaryContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || todayId();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [weightLog, setWeightLog] = useState<WeightLog | null>(null);
  const [weightInput, setWeightInput] = useState(0);
  const [loading, setLoading] = useState(true);

  function goToDate(newDate: string) {
    router.push(`/diary?date=${newDate}`);
  }

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      const [p, f, l, w] = await Promise.all([
        getProfile(user.uid),
        listFoods(user.uid),
        listFoodLogsForDate(user.uid, date),
        getWeightLog(user.uid, date),
      ]);
      setProfile(p);
      setFoods(f);
      setLogs(l);
      setWeightLog(w);
      setWeightInput(w ? w.weightKg : 0);
      setLoading(false);
    })();
  }, [user, date]);

  async function refreshLogs() {
    if (!user) return;
    setLogs(await listFoodLogsForDate(user.uid, date));
  }

  async function handleDeleteLog(logId: string) {
    if (!user) return;
    await deleteFoodLog(user.uid, logId);
    await refreshLogs();
  }

  async function handleSaveWeight() {
    if (!user || !weightInput) return;
    await upsertWeightLog(user.uid, { date, weightKg: weightInput });
    setWeightLog(await getWeightLog(user.uid, date));
  }

  const totals = sumNutrients(logs.map((l) => l.nutrients));
  const totalCost = logs.reduce((sum, l) => sum + (l.costInr ?? 0), 0);
  const calorieGoal = profile?.dailyCalorieGoal ?? 2000;
  const macroGoals = profile?.macroGoals ?? DEFAULT_MACRO_GOALS;

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => goToDate(addDays(date, -1))}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          ← Prev
        </button>
        <div className="flex flex-1 items-center justify-center gap-2 sm:flex-none">
          <input
            type="date"
            className="input w-auto min-w-0"
            value={date}
            onChange={(e) => goToDate(e.target.value)}
          />
          {date !== todayId() && (
            <button
              onClick={() => goToDate(todayId())}
              className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => goToDate(addDays(date, 1))}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Next →
        </button>
      </div>

      <MacroSummary totals={totals} calorieGoal={calorieGoal} macroGoals={macroGoals} />

      {totalCost > 0 && (
        <p className="text-sm text-gray-600">
          Today&apos;s food cost: <span className="font-semibold">₹{Math.round(totalCost)}</span>
        </p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Weight for this day</h2>
        <div className="flex flex-wrap items-center gap-2">
          <NumberInput
            step="0.1"
            className="input max-w-[140px]"
            placeholder="kg"
            value={weightInput}
            onChange={setWeightInput}
          />
          <button
            onClick={handleSaveWeight}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {weightLog ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {foods.length === 0 && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          You don&apos;t have any saved foods yet.{" "}
          <a href="/foods" className="underline">
            Search &amp; save foods
          </a>{" "}
          first, then log them here.
        </p>
      )}

      {MEALS.map((meal) => (
        <MealSection
          key={meal.type}
          mealType={meal.type}
          label={meal.label}
          date={date}
          foods={foods}
          logs={logs.filter((l) => l.mealType === meal.type)}
          onAdded={refreshLogs}
          onDelete={handleDeleteLog}
        />
      ))}
    </div>
  );
}

function MealSection({
  mealType,
  label,
  date,
  foods,
  logs,
  onAdded,
  onDelete,
}: {
  mealType: MealType;
  label: string;
  date: string;
  foods: Food[];
  logs: FoodLog[];
  onAdded: () => void;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuth();
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const mealTotal = sumNutrients(logs.map((l) => l.nutrients));

  async function handleAdd() {
    if (!user || !selectedFoodId) return;
    const food = foods.find((f) => f.id === selectedFoodId);
    if (!food) return;
    const nutrients = scaleNutrients(food.nutrients, quantity);
    await addFoodLog(user.uid, {
      date,
      mealType,
      foodId: food.id,
      foodName: food.name,
      quantity,
      unit: `x ${food.servingSize}${food.servingUnit}`,
      nutrients,
      ...(food.costInr != null ? { costInr: food.costInr * quantity } : {}),
    });
    setSelectedFoodId("");
    setQuantity(1);
    onAdded();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        <span className="text-xs text-gray-400">{Math.round(mealTotal.calories)} kcal</span>
      </div>

      {logs.length > 0 && (
        <ul className="mb-3 divide-y divide-gray-100">
          {logs.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate">{l.foodName}</p>
                <p className="text-xs text-gray-500">
                  {l.quantity} serving{l.quantity !== 1 ? "s" : ""} · {Math.round(l.nutrients.calories)} kcal
                  · P{Math.round(l.nutrients.protein)}g · F{Math.round(l.nutrients.fat)}g · C
                  {Math.round(l.nutrients.carbs)}g
                  {l.costInr != null && ` · ₹${Math.round(l.costInr)}`}
                </p>
              </div>
              <button
                onClick={() => onDelete(l.id)}
                className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          className="input min-w-0 flex-1 basis-full sm:basis-0"
          value={selectedFoodId}
          onChange={(e) => setSelectedFoodId(e.target.value)}
        >
          <option value="">Select a food...</option>
          {foods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <NumberInput
          step="0.25"
          min={0}
          className="input w-24 flex-none"
          value={quantity}
          onChange={setQuantity}
        />
        <button
          onClick={handleAdd}
          disabled={!selectedFoodId}
          className="flex-none rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function DiaryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <DiaryContent />
    </Suspense>
  );
}
