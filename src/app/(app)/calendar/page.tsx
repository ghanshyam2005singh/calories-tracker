"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { listFoodLogsForRange } from "@/lib/firestore/foodLogs";
import { listWeightLogs } from "@/lib/firestore/weightLogs";
import { sumNutrients, todayId } from "@/lib/nutrition";
import type { FoodLog, WeightLog } from "@/types";

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) => todayId(d);
  return { start, end, startId: fmt(start), endId: fmt(end) };
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useAppData();
  const router = useRouter();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const { start, startId, endId } = monthRange(cursor.year, cursor.month);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      const [l, w] = await Promise.all([
        listFoodLogsForRange(user.uid, startId, endId),
        listWeightLogs(user.uid, startId, endId),
      ]);
      setLogs(l);
      setWeights(w);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startId, endId]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, FoodLog[]>();
    for (const l of logs) {
      if (!map.has(l.date)) map.set(l.date, []);
      map.get(l.date)!.push(l);
    }
    return map;
  }, [logs]);

  const weightByDate = useMemo(() => {
    const map = new Map<string, WeightLog>();
    for (const w of weights) map.set(w.date, w);
    return map;
  }, [weights]);

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstWeekday = start.getDay();
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      todayId(new Date(cursor.year, cursor.month, i + 1))
    ),
  ];

  const calorieGoal = profile?.dailyCalorieGoal ?? 2000;

  function caloriePct(dateId: string): number | null {
    const dayLogs = logsByDate.get(dateId);
    if (!dayLogs || dayLogs.length === 0) return null;
    const totals = sumNutrients(dayLogs.map((l) => l.nutrients));
    return Math.round((totals.calories / calorieGoal) * 100);
  }

  function statusClasses(pct: number | null) {
    if (pct === null) return { bg: "bg-gray-50", text: "text-gray-400" };
    if (Math.abs(pct - 100) <= 5) return { bg: "bg-emerald-100", text: "text-emerald-700" };
    if (pct > 100) return { bg: "bg-red-100", text: "text-red-700" };
    return { bg: "bg-blue-100", text: "text-blue-700" };
  }

  const isLoading = loading || profileLoading;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
          }
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          ← Prev
        </button>
        <h1 className="text-lg font-semibold">
          {new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </h1>
        <button
          onClick={() =>
            setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
          }
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Next →
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateId, i) => {
              if (!dateId) return <div key={`empty-${i}`} />;
              const pct = caloriePct(dateId);
              const { bg, text } = statusClasses(pct);
              const weight = weightByDate.get(dateId);
              return (
                <button
                  key={dateId}
                  onClick={() => router.push(`/diary?date=${dateId}`)}
                  className={`flex h-16 flex-col items-center justify-center rounded-md border border-gray-200 text-xs hover:opacity-80 ${bg}`}
                >
                  <span className="font-medium">{Number(dateId.split("-")[2])}</span>
                  {pct !== null && <span className={`text-[10px] font-semibold ${text}`}>{pct}%</span>}
                  {weight && <span className="text-[10px] text-gray-500">{weight.weightKg}kg</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <Legend color="bg-emerald-100" label="Within 5% of goal" />
            <Legend color="bg-blue-100" label="Under goal" />
            <Legend color="bg-red-100" label="Over goal" />
            <Legend color="bg-gray-50" label="No entries" />
          </div>
        </>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm border border-gray-200 ${color}`} />
      {label}
    </span>
  );
}
