"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Legend,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/lib/firestore/profile";
import { listFoodLogsForRange } from "@/lib/firestore/foodLogs";
import { listWeightLogs } from "@/lib/firestore/weightLogs";
import { addDays, sumNutrients, todayId } from "@/lib/nutrition";
import type { FoodLog, Profile, WeightLog } from "@/types";

const RANGES = [
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
];

export default function ProgressPage() {
  const { user } = useAuth();
  const [rangeDays, setRangeDays] = useState(30);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const end = todayId();
    const start = addDays(end, -rangeDays);
    (async () => {
      const [p, w, l] = await Promise.all([
        getProfile(user.uid),
        listWeightLogs(user.uid, start, end),
        listFoodLogsForRange(user.uid, start, end),
      ]);
      setProfile(p);
      setWeights(w);
      setLogs(l);
      setLoading(false);
    })();
  }, [user, rangeDays]);

  const weightSeries = useMemo(() => {
    return weights.map((w, i) => {
      const windowStart = Math.max(0, i - 6);
      const windowVals = weights.slice(windowStart, i + 1).map((x) => x.weightKg);
      const avg = windowVals.reduce((a, b) => a + b, 0) / windowVals.length;
      return { date: w.date.slice(5), weight: w.weightKg, avg: Math.round(avg * 10) / 10 };
    });
  }, [weights]);

  const weeklyRateKgPerWeek = useMemo(() => {
    if (weights.length < 2) return null;
    const first = weights[0];
    const last = weights[weights.length - 1];
    const days =
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 0) return null;
    return ((last.weightKg - first.weightKg) / days) * 7;
  }, [weights]);

  const calorieSeries = useMemo(() => {
    const byDate = new Map<string, FoodLog[]>();
    for (const l of logs) {
      if (!byDate.has(l.date)) byDate.set(l.date, []);
      byDate.get(l.date)!.push(l);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayLogs]) => ({
        date: date.slice(5),
        calories: Math.round(sumNutrients(dayLogs.map((l) => l.nutrients)).calories),
        goal: profile?.dailyCalorieGoal ?? 2000,
      }));
  }, [logs, profile]);

  const macroTotals = useMemo(() => {
    const totals = sumNutrients(logs.map((l) => l.nutrients));
    return [
      { name: "Protein", grams: Math.round(totals.protein) },
      { name: "Fat", grams: Math.round(totals.fat) },
      { name: "Carbs", grams: Math.round(totals.carbs) },
    ];
  }, [logs]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Progress</h1>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                rangeDays === r.days ? "bg-gray-900 text-white" : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Weight trend</h2>
              {weeklyRateKgPerWeek !== null && (
                <span className="text-xs text-gray-500">
                  {weeklyRateKgPerWeek >= 0 ? "+" : ""}
                  {weeklyRateKgPerWeek.toFixed(2)} kg/week over this range
                </span>
              )}
            </div>
            {weightSeries.length === 0 ? (
              <p className="text-sm text-gray-400">No weight entries in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={weightSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#111827" dot={{ r: 2 }} />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    name="7-entry avg"
                    stroke="#3b82f6"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Calories vs goal</h2>
            {calorieSeries.length === 0 ? (
              <p className="text-sm text-gray-400">No food logged in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={calorieSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" name="Calories" stroke="#111827" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="goal" name="Goal" stroke="#ef4444" strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Total macros this range</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-400">No food logged in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={macroTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="grams" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>
        </>
      )}
    </div>
  );
}
