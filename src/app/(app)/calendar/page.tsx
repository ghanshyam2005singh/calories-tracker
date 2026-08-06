"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/lib/firestore/profile";
import { listFoodLogsForRange } from "@/lib/firestore/foodLogs";
import { listWeightLogs } from "@/lib/firestore/weightLogs";
import { sumNutrients, todayId } from "@/lib/nutrition";
import type { FoodLog, Profile, WeightLog } from "@/types";

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) => todayId(d);
  return { start, end, startId: fmt(start), endId: fmt(end) };
}

export default function CalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const { start, startId, endId } = monthRange(cursor.year, cursor.month);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      const [p, l, w] = await Promise.all([
        getProfile(user.uid),
        listFoodLogsForRange(user.uid, startId, endId),
        listWeightLogs(user.uid, startId, endId),
      ]);
      setProfile(p);
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

  function statusColor(dateId: string) {
    const dayLogs = logsByDate.get(dateId);
    if (!dayLogs || dayLogs.length === 0) return "bg-gray-50";
    const totals = sumNutrients(dayLogs.map((l) => l.nutrients));
    const diff = totals.calories - calorieGoal;
    if (Math.abs(diff) <= calorieGoal * 0.05) return "bg-emerald-100";
    if (diff > 0) return "bg-red-100";
    return "bg-blue-100";
  }

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

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateId, i) =>
              dateId ? (
                <button
                  key={dateId}
                  onClick={() => router.push(`/diary?date=${dateId}`)}
                  className={`flex h-16 flex-col items-center justify-center rounded-md border border-gray-200 text-xs hover:opacity-80 ${statusColor(
                    dateId
                  )}`}
                >
                  <span className="font-medium">{Number(dateId.split("-")[2])}</span>
                  {weightByDate.get(dateId) && (
                    <span className="text-[10px] text-gray-500">
                      {weightByDate.get(dateId)!.weightKg}kg
                    </span>
                  )}
                </button>
              ) : (
                <div key={`empty-${i}`} />
              )
            )}
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
