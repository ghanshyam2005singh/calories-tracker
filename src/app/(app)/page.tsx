"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { listFoodLogsForDate, listFoodLogsForRange } from "@/lib/firestore/foodLogs";
import { getWeightLog, listWeightLogs } from "@/lib/firestore/weightLogs";
import { getWaterLog } from "@/lib/firestore/waterLogs";
import { addDays, sumNutrients, todayId } from "@/lib/nutrition";
import MacroSummary from "@/components/MacroSummary";
import NutrientAdvice from "@/components/NutrientAdvice";
import type { WeightLog } from "@/types";

const DEFAULT_MACRO_GOALS = { proteinG: 150, fatG: 65, carbG: 200 };

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, foods, loading: dataLoading } = useAppData();
  const [todayTotals, setTodayTotals] = useState(sumNutrients([]));
  const [todayWeight, setTodayWeight] = useState<WeightLog | null>(null);
  const [todayWaterMl, setTodayWaterMl] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const today = todayId();
    (async () => {
      const [logs, w, water] = await Promise.all([
        listFoodLogsForDate(user.uid, today),
        getWeightLog(user.uid, today),
        getWaterLog(user.uid, today),
      ]);
      setTodayTotals(sumNutrients(logs.map((l) => l.nutrients)));
      setTodayWeight(w);
      setTodayWaterMl(water?.ml ?? 0);

      // Compute a simple logging streak over the last 30 days.
      const start = addDays(today, -30);
      const [rangeLogs, rangeWeights] = await Promise.all([
        listFoodLogsForRange(user.uid, start, today),
        listWeightLogs(user.uid, start, today),
      ]);
      const loggedDates = new Set([
        ...rangeLogs.map((l) => l.date),
        ...rangeWeights.map((w) => w.date),
      ]);
      let s = 0;
      let cursor = today;
      while (loggedDates.has(cursor)) {
        s++;
        cursor = addDays(cursor, -1);
      }
      setStreak(s);
      setLoading(false);
    })();
  }, [user]);

  if (loading || dataLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  if (!profile) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Welcome! Set up your{" "}
        <Link href="/settings" className="underline">
          profile and goals
        </Link>{" "}
        to get personalized calorie and macro targets.
      </div>
    );
  }

  const calorieGoal = profile.dailyCalorieGoal;
  const remaining = Math.round(calorieGoal - todayTotals.calories);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">
          {profile.name ? `Hi, ${profile.name}` : "Today"}
        </h1>
        <p className="text-sm text-gray-500">{todayId()}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          label="Calories remaining"
          value={`${remaining}`}
          sub={`${Math.round(todayTotals.calories)} / ${calorieGoal} kcal`}
        />
        <StatCard
          label="Today's weight"
          value={todayWeight ? `${todayWeight.weightKg} kg` : "—"}
          sub={todayWeight ? "Logged" : "Not logged yet"}
        />
        <StatCard
          label="Water"
          value={`${(todayWaterMl / 1000).toFixed(2)} L`}
          sub="Log it in Diary"
        />
        <StatCard label="Logging streak" value={`${streak} day${streak !== 1 ? "s" : ""}`} sub="Keep it going" />
      </div>

      <MacroSummary totals={todayTotals} calorieGoal={calorieGoal} macroGoals={profile.macroGoals ?? DEFAULT_MACRO_GOALS} />

      {todayTotals.calories > 0 && (
        <NutrientAdvice
          totals={todayTotals}
          calorieGoal={calorieGoal}
          macroGoals={profile.macroGoals ?? DEFAULT_MACRO_GOALS}
          foods={foods}
        />
      )}

      <div className="flex gap-3">
        <Link
          href="/diary"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Log food / weight
        </Link>
        <Link
          href="/progress"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          View progress
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  );
}
