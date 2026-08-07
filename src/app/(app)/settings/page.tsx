"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import NumberInput from "@/components/NumberInput";
import { saveProfile } from "@/lib/firestore/profile";
import { getLatestWeightLog } from "@/lib/firestore/weightLogs";
import {
  ACTIVITY_LABELS,
  calculateAge,
  calculateBMR,
  calculateTDEE,
  suggestDailyCalories,
  suggestMacroGoals,
} from "@/lib/nutrition";
import type { ActivityLevel, GoalType, Profile, Sex } from "@/types";

const DEFAULT_PROFILE: Profile = {
  name: "",
  dob: "",
  sex: "male",
  heightCm: 170,
  activityLevel: "moderate",
  goalType: "maintain",
  weeklyRateKg: 0.5,
  dailyCalorieGoal: 2000,
  macroGoals: { proteinG: 150, fatG: 65, carbG: 200 },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile: cachedProfile, loading: dataLoading, refreshProfile } = useAppData();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [currentWeight, setCurrentWeight] = useState<number>(70);
  const [weightLoading, setWeightLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoGoals, setAutoGoals] = useState(true);
  const loading = dataLoading || weightLoading;

  useEffect(() => {
    if (cachedProfile) setProfile(cachedProfile);
  }, [cachedProfile]);

  useEffect(() => {
    if (!user) return;
    getLatestWeightLog(user.uid).then((w) => {
      if (w) setCurrentWeight(w.weightKg);
      setWeightLoading(false);
    });
  }, [user]);

  const age = profile.dob ? calculateAge(profile.dob) : null;
  const bmr =
    age !== null ? calculateBMR(profile.sex, currentWeight, profile.heightCm, age) : null;
  const tdee = bmr !== null ? calculateTDEE(bmr, profile.activityLevel) : null;
  const suggestedCalories =
    tdee !== null
      ? suggestDailyCalories(tdee, profile.goalType, profile.weeklyRateKg)
      : null;
  const suggestedMacros =
    suggestedCalories !== null ? suggestMacroGoals(suggestedCalories) : null;

  useEffect(() => {
    if (autoGoals && suggestedCalories !== null && suggestedMacros) {
      setProfile((p) => ({
        ...p,
        dailyCalorieGoal: suggestedCalories,
        macroGoals: suggestedMacros,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGoals, suggestedCalories, suggestedMacros?.proteinG, suggestedMacros?.fatG, suggestedMacros?.carbG]);

  async function handleSave() {
    if (!user || saving) return;
    setSaving(true);
    setSaved(false);
    await saveProfile(user.uid, profile);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold">Profile & Goals</h1>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700">About you</h2>
        <Field label="Name">
          <input
            className="input"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </Field>
        <Field label="Date of birth">
          <input
            type="date"
            className="input"
            value={profile.dob}
            onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
          />
        </Field>
        <Field label="Sex">
          <select
            className="input"
            value={profile.sex}
            onChange={(e) => setProfile({ ...profile, sex: e.target.value as Sex })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Height (cm)">
          <NumberInput
            className="input"
            value={profile.heightCm}
            onChange={(v) => setProfile({ ...profile, heightCm: v })}
          />
        </Field>
        <Field label="Current weight (kg)">
          <NumberInput
            step="0.1"
            className="input"
            value={currentWeight}
            onChange={setCurrentWeight}
          />
          <p className="mt-1 text-xs text-gray-400">
            Log actual daily weights in the Diary — this is just used to estimate your goals.
          </p>
        </Field>
        <Field label="Activity level">
          <select
            className="input"
            value={profile.activityLevel}
            onChange={(e) =>
              setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })
            }
          >
            {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700">Goal</h2>
        <Field label="Goal type">
          <select
            className="input"
            value={profile.goalType}
            onChange={(e) => setProfile({ ...profile, goalType: e.target.value as GoalType })}
          >
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain weight</option>
            <option value="gain">Gain weight</option>
          </select>
        </Field>
        {profile.goalType !== "maintain" && (
          <Field label="Target rate (kg/week)">
            <NumberInput
              step="0.1"
              className="input"
              value={profile.weeklyRateKg}
              onChange={(v) => setProfile({ ...profile, weeklyRateKg: v })}
            />
          </Field>
        )}

        {bmr !== null && tdee !== null && (
          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
            <p>
              BMR: <strong>{Math.round(bmr)}</strong> kcal · Maintenance (TDEE):{" "}
              <strong>{Math.round(tdee)}</strong> kcal
            </p>
            {suggestedCalories !== null && (
              <p>
                Suggested daily goal: <strong>{suggestedCalories}</strong> kcal
              </p>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={autoGoals}
            onChange={(e) => setAutoGoals(e.target.checked)}
          />
          Auto-calculate calorie & macro goals from the above
        </label>

        <Field label="Daily calorie goal">
          <NumberInput
            className="input"
            disabled={autoGoals}
            value={profile.dailyCalorieGoal}
            onChange={(v) => setProfile({ ...profile, dailyCalorieGoal: v })}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Protein (g)">
            <NumberInput
              className="input"
              disabled={autoGoals}
              value={profile.macroGoals.proteinG}
              onChange={(v) =>
                setProfile({
                  ...profile,
                  macroGoals: { ...profile.macroGoals, proteinG: v },
                })
              }
            />
          </Field>
          <Field label="Fat (g)">
            <NumberInput
              className="input"
              disabled={autoGoals}
              value={profile.macroGoals.fatG}
              onChange={(v) =>
                setProfile({
                  ...profile,
                  macroGoals: { ...profile.macroGoals, fatG: v },
                })
              }
            />
          </Field>
          <Field label="Carbs (g)">
            <NumberInput
              className="input"
              disabled={autoGoals}
              value={profile.macroGoals.carbG}
              onChange={(v) =>
                setProfile({
                  ...profile,
                  macroGoals: { ...profile.macroGoals, carbG: v },
                })
              }
            />
          </Field>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save profile"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
