"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import NumberInput from "@/components/NumberInput";
import { listFoodLogsForDate, addFoodLog, deleteFoodLog } from "@/lib/firestore/foodLogs";
import { getWeightLog, upsertWeightLog } from "@/lib/firestore/weightLogs";
import { getBodyMeasurementLog, upsertBodyMeasurementLog } from "@/lib/firestore/bodyMeasurements";
import { getActivityLog, upsertActivityLog } from "@/lib/firestore/activityLogs";
import { addWater, getWaterLog, resetWater } from "@/lib/firestore/waterLogs";
import { addDays, scaleNutrients, sumNutrients, todayId } from "@/lib/nutrition";
import MacroSummary from "@/components/MacroSummary";
import NutrientAdvice from "@/components/NutrientAdvice";
import type { ActivityLog, BodyMeasurementLog, Food, FoodLog, MealType, WeightLog } from "@/types";

const MEALS: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch", label: "Lunch" },
  { type: "dinner", label: "Dinner" },
  { type: "snack", label: "Snacks" },
];

const DEFAULT_MACRO_GOALS = { proteinG: 150, fatG: 65, carbG: 200 };
const WATER_QUICK_ADD = [500, 750, 1000];
const WATER_GOAL_ML = 3000;
const MEASUREMENT_FIELDS: { key: keyof Omit<BodyMeasurementLog, "id" | "date" | "note" | "createdAt">; label: string }[] = [
  { key: "waistCm", label: "Waist" }, { key: "chestCm", label: "Chest" }, { key: "faceCm", label: "Face" },
  { key: "neckCm", label: "Neck" }, { key: "leftBicepsCm", label: "Left biceps" }, { key: "rightBicepsCm", label: "Right biceps" },
  { key: "leftThighCm", label: "Left thigh" }, { key: "rightThighCm", label: "Right thigh" },
];
const emptyMeasurements = () => Object.fromEntries(MEASUREMENT_FIELDS.map(({ key }) => [key, ""])) as Record<(typeof MEASUREMENT_FIELDS)[number]["key"], string>;

function DiaryContent() {
  const { user } = useAuth();
  const { profile, foods } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || todayId();

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [weightLog, setWeightLog] = useState<WeightLog | null>(null);
  const [weightInput, setWeightInput] = useState(0);
  const [savingWeight, setSavingWeight] = useState(false);
  const [measurementValues, setMeasurementValues] = useState(emptyMeasurements);
  const [measurementNote, setMeasurementNote] = useState("");
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [activity, setActivity] = useState<ActivityLog | null>(null);
  const [activityValues, setActivityValues] = useState({ steps: "", walkingMinutes: "", runningMinutes: "", runningSpeedKph: "", workoutName: "", workoutMinutes: "", bodyParts: "", caloriesBurned: "", note: "" });
  const [savingActivity, setSavingActivity] = useState(false);
  const [waterMl, setWaterMl] = useState(0);
  const [addingWater, setAddingWater] = useState(false);
  const [loading, setLoading] = useState(true);

  function goToDate(newDate: string) {
    router.push(`/diary?date=${newDate}`);
  }

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      const [l, w, water, measurements, activityLog] = await Promise.all([
        listFoodLogsForDate(user.uid, date),
        getWeightLog(user.uid, date),
        getWaterLog(user.uid, date),
        getBodyMeasurementLog(user.uid, date),
        getActivityLog(user.uid, date),
      ]);
      setLogs(l);
      setWeightLog(w);
      setWeightInput(w ? w.weightKg : 0);
      setWaterMl(water?.ml ?? 0);
      setMeasurementValues(Object.fromEntries(MEASUREMENT_FIELDS.map(({ key }) => [key, measurements?.[key]?.toString() ?? ""])) as typeof measurementValues);
      setMeasurementNote(measurements?.note ?? "");
      setActivity(activityLog);
      setActivityValues({
        steps: activityLog?.steps?.toString() ?? "", walkingMinutes: activityLog?.walkingMinutes?.toString() ?? "",
        runningMinutes: activityLog?.runningMinutes?.toString() ?? "", runningSpeedKph: activityLog?.runningSpeedKph?.toString() ?? "",
        workoutName: activityLog?.workoutName ?? "", workoutMinutes: activityLog?.workoutMinutes?.toString() ?? "",
        bodyParts: activityLog?.bodyParts?.join(", ") ?? "", caloriesBurned: activityLog?.caloriesBurned?.toString() ?? "", note: activityLog?.note ?? "",
      });
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
    if (!user || !weightInput || savingWeight) return;
    setSavingWeight(true);
    try {
      await upsertWeightLog(user.uid, { date, weightKg: weightInput });
      setWeightLog(await getWeightLog(user.uid, date));
    } finally {
      setSavingWeight(false);
    }
  }

  async function handleAddWater(ml: number) {
    if (!user || addingWater) return;
    setAddingWater(true);
    try {
      await addWater(user.uid, date, ml);
      setWaterMl((prev) => prev + ml);
    } finally {
      setAddingWater(false);
    }
  }

  async function handleSaveMeasurements() {
    if (!user || savingMeasurements) return;
    setSavingMeasurements(true);
    try {
      const values = Object.fromEntries(MEASUREMENT_FIELDS.flatMap(({ key }) => {
        const value = Number(measurementValues[key]);
        return measurementValues[key] !== "" && Number.isFinite(value) && value > 0 ? [[key, value]] : [];
      }));
      await upsertBodyMeasurementLog(user.uid, { date, ...values, note: measurementNote.trim() || undefined });
    } finally { setSavingMeasurements(false); }
  }

  async function handleSaveActivity() {
    if (!user || savingActivity) return;
    setSavingActivity(true);
    try {
      const numeric = (key: "steps" | "walkingMinutes" | "runningMinutes" | "runningSpeedKph" | "workoutMinutes" | "caloriesBurned") => {
        const value = Number(activityValues[key]);
        return activityValues[key] !== "" && Number.isFinite(value) && value >= 0 ? value : undefined;
      };
      const entry = {
        date, steps: numeric("steps"), walkingMinutes: numeric("walkingMinutes"), runningMinutes: numeric("runningMinutes"),
        runningSpeedKph: numeric("runningSpeedKph"), workoutMinutes: numeric("workoutMinutes"), caloriesBurned: numeric("caloriesBurned"),
        workoutName: activityValues.workoutName.trim() || undefined,
        bodyParts: activityValues.bodyParts.split(",").map((part) => part.trim()).filter(Boolean), note: activityValues.note.trim() || undefined,
      };
      await upsertActivityLog(user.uid, entry);
      setActivity(await getActivityLog(user.uid, date));
    } finally { setSavingActivity(false); }
  }

  async function handleResetWater() {
    if (!user || addingWater) return;
    setAddingWater(true);
    try {
      await resetWater(user.uid, date);
      setWaterMl(0);
    } finally {
      setAddingWater(false);
    }
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

      {logs.length > 0 && (
        <NutrientAdvice totals={totals} calorieGoal={calorieGoal} macroGoals={macroGoals} foods={foods} />
      )}

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
            className="input max-w-35"
            placeholder="kg"
            value={weightInput}
            onChange={setWeightInput}
          />
          <button
            onClick={handleSaveWeight}
            disabled={savingWeight}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {savingWeight ? "Saving..." : weightLog ? "Update" : "Save"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Body measurements</h2>
          <span className="text-xs text-gray-400">cm · weekly is usually enough</span>
        </div>
        <p className="mb-3 text-xs text-gray-500">Track the areas that matter to you, measured consistently at the same time of day.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MEASUREMENT_FIELDS.map(({ key, label }) => (
            <label key={key} className="text-xs text-gray-500">{label}
              <input type="number" min="0" step="0.1" placeholder="cm" className="input mt-1 w-full" value={measurementValues[key]} onChange={(e) => setMeasurementValues((prev) => ({ ...prev, [key]: e.target.value }))} />
            </label>
          ))}
        </div>
        <input className="input mt-2 w-full" placeholder="Optional measurement note" value={measurementNote} onChange={(e) => setMeasurementNote(e.target.value)} />
        <button onClick={handleSaveMeasurements} disabled={savingMeasurements} className="mt-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{savingMeasurements ? "Saving..." : "Save measurements"}</button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">Activity &amp; training</h2>
        <p className="mb-3 text-xs text-gray-500">Enter phone/watch steps manually for now. Calories burned are recorded separately and do not change your food goal.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ActivityInput label="Steps" value={activityValues.steps} onChange={(value) => setActivityValues((prev) => ({ ...prev, steps: value }))} />
          <ActivityInput label="Walking min" value={activityValues.walkingMinutes} onChange={(value) => setActivityValues((prev) => ({ ...prev, walkingMinutes: value }))} />
          <ActivityInput label="Running min" value={activityValues.runningMinutes} onChange={(value) => setActivityValues((prev) => ({ ...prev, runningMinutes: value }))} />
          <ActivityInput label="Run speed (km/h)" step="0.1" value={activityValues.runningSpeedKph} onChange={(value) => setActivityValues((prev) => ({ ...prev, runningSpeedKph: value }))} />
          <ActivityInput label="Workout min" value={activityValues.workoutMinutes} onChange={(value) => setActivityValues((prev) => ({ ...prev, workoutMinutes: value }))} />
          <ActivityInput label="Calories burned" value={activityValues.caloriesBurned} onChange={(value) => setActivityValues((prev) => ({ ...prev, caloriesBurned: value }))} />
          <label className="col-span-2 text-xs text-gray-500">Workout (e.g. Push day)<input className="input mt-1 w-full" value={activityValues.workoutName} onChange={(e) => setActivityValues((prev) => ({ ...prev, workoutName: e.target.value }))} /></label>
          <label className="col-span-2 text-xs text-gray-500">Body parts (comma separated)<input className="input mt-1 w-full" placeholder="Chest, shoulders, triceps" value={activityValues.bodyParts} onChange={(e) => setActivityValues((prev) => ({ ...prev, bodyParts: e.target.value }))} /></label>
        </div>
        <input className="input mt-2 w-full" placeholder="Optional activity note" value={activityValues.note} onChange={(e) => setActivityValues((prev) => ({ ...prev, note: e.target.value }))} />
        <button onClick={handleSaveActivity} disabled={savingActivity} className="mt-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{savingActivity ? "Saving..." : activity ? "Update activity" : "Save activity"}</button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Water</h2>
          <span className="text-xs text-gray-400">
            {(waterMl / 1000).toFixed(2)} L / {(WATER_GOAL_ML / 1000).toFixed(1)} L
          </span>
        </div>
        <div className="mb-2 h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-sky-500"
            style={{ width: `${Math.min(100, (waterMl / WATER_GOAL_ML) * 100)}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {WATER_QUICK_ADD.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAddWater(ml)}
              disabled={addingWater}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              +{ml}ml
            </button>
          ))}
          <button
            onClick={handleResetWater}
            disabled={addingWater}
            className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
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
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const mealTotal = sumNutrients(logs.map((l) => l.nutrients));

  async function handleAdd() {
    if (!user || !selectedFoodId || adding) return;
    const food = foods.find((f) => f.id === selectedFoodId);
    if (!food) return;
    setAdding(true);
    try {
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
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(logId: string) {
    if (deletingId) return;
    setDeletingId(logId);
    try {
      await onDelete(logId);
    } finally {
      setDeletingId(null);
    }
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
                onClick={() => handleDelete(l.id)}
                disabled={deletingId !== null}
                className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {deletingId === l.id ? "..." : "Delete"}
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
          disabled={!selectedFoodId || adding}
          className="flex-none rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}

function ActivityInput({ label, value, onChange, step = "1" }: { label: string; value: string; onChange: (value: string) => void; step?: string }) {
  return (
    <label className="text-xs text-gray-500">
      {label}
      <input type="number" min="0" step={step} className="input mt-1 w-full" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function DiaryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <DiaryContent />
    </Suspense>
  );
}
