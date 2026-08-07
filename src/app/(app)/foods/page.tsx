"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import NumberInput from "@/components/NumberInput";
import { addFood, deleteFood } from "@/lib/firestore/foods";
import { SEED_FOODS } from "@/lib/seedFoods";
import type { Nutrients } from "@/types";

interface SearchResult {
  fdcId: number;
  name: string;
  brandName?: string;
  servingSize: number;
  servingUnit: string;
  nutrients: Nutrients;
}

const EMPTY_CUSTOM = {
  name: "",
  servingSize: 100,
  servingUnit: "g",
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  costInr: 0,
};

export default function FoodsPage() {
  const { user } = useAuth();
  const { foods: savedFoods, refreshFoods } = useAppData();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [customFood, setCustomFood] = useState(EMPTY_CUSTOM);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const [savingResultId, setSavingResultId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/food-search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function handleSaveResult(result: SearchResult) {
    if (!user || savingResultId !== null) return;
    setSavingResultId(result.fdcId);
    try {
      await addFood(user.uid, {
        name: result.brandName ? `${result.name} (${result.brandName})` : result.name,
        source: "usda",
        fdcId: result.fdcId,
        servingSize: result.servingSize,
        servingUnit: result.servingUnit,
        nutrients: result.nutrients,
      });
      await refreshFoods();
    } finally {
      setSavingResultId(null);
    }
  }

  async function handleSaveCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !customFood.name.trim() || savingCustom) return;
    setSavingCustom(true);
    try {
      await addFood(user.uid, {
        name: customFood.name,
        source: "custom",
        servingSize: customFood.servingSize,
        servingUnit: customFood.servingUnit,
        nutrients: {
          calories: customFood.calories,
          protein: customFood.protein,
          fat: customFood.fat,
          carbs: customFood.carbs,
        },
        ...(customFood.costInr > 0 ? { costInr: customFood.costInr } : {}),
      });
      setCustomFood(EMPTY_CUSTOM);
      setShowCustomForm(false);
      await refreshFoods();
    } finally {
      setSavingCustom(false);
    }
  }

  async function handleDelete(foodId: string) {
    if (!user || deletingId) return;
    setDeletingId(foodId);
    try {
      await deleteFood(user.uid, foodId);
      await refreshFoods();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImportSeedFoods() {
    if (!user || importing) return;
    setImporting(true);
    try {
      const existingNames = new Set(savedFoods.map((f) => f.name));
      const toAdd = SEED_FOODS.filter((f) => !existingNames.has(f.name));
      for (const food of toAdd) {
        await addFood(user.uid, food);
      }
      await refreshFoods();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-lg font-semibold">Search USDA food database</h1>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <input
            className="input min-w-0 flex-1 basis-full sm:basis-0"
            placeholder="e.g. chicken breast, banana, oats"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={searching}
            className="flex-none rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {results.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {results.map((r) => (
              <li key={r.fdcId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.name}
                    {r.brandName ? ` (${r.brandName})` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    Per {r.servingSize}
                    {r.servingUnit}: {Math.round(r.nutrients.calories)} kcal · P
                    {Math.round(r.nutrients.protein)}g · F{Math.round(r.nutrients.fat)}g · C
                    {Math.round(r.nutrients.carbs)}g
                  </p>
                </div>
                <button
                  onClick={() => handleSaveResult(r)}
                  disabled={savingResultId !== null}
                  className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {savingResultId === r.fdcId ? "Saving..." : "Save to library"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">My food library</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleImportSeedFoods}
              disabled={importing}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import my reference foods"}
            </button>
            <button
              onClick={() => setShowCustomForm((v) => !v)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
            >
              {showCustomForm ? "Cancel" : "+ Add custom food"}
            </button>
          </div>
        </div>

        {showCustomForm && (
          <form
            onSubmit={handleSaveCustom}
            className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-4"
          >
            <input
              className="input col-span-2 sm:col-span-4"
              placeholder="Food name"
              value={customFood.name}
              onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
              required
            />
            <NumberInput
              className="input"
              placeholder="Serving size"
              value={customFood.servingSize}
              onChange={(v) => setCustomFood({ ...customFood, servingSize: v })}
            />
            <input
              className="input"
              placeholder="Unit (g, ml, cup...)"
              value={customFood.servingUnit}
              onChange={(e) => setCustomFood({ ...customFood, servingUnit: e.target.value })}
            />
            <NumberInput
              className="input"
              placeholder="Calories"
              value={customFood.calories}
              onChange={(v) => setCustomFood({ ...customFood, calories: v })}
            />
            <NumberInput
              className="input"
              placeholder="Cost (₹)"
              value={customFood.costInr}
              onChange={(v) => setCustomFood({ ...customFood, costInr: v })}
            />
            <NumberInput
              className="input"
              placeholder="Protein (g)"
              value={customFood.protein}
              onChange={(v) => setCustomFood({ ...customFood, protein: v })}
            />
            <NumberInput
              className="input"
              placeholder="Fat (g)"
              value={customFood.fat}
              onChange={(v) => setCustomFood({ ...customFood, fat: v })}
            />
            <NumberInput
              className="input"
              placeholder="Carbs (g)"
              value={customFood.carbs}
              onChange={(v) => setCustomFood({ ...customFood, carbs: v })}
            />
            <button
              type="submit"
              disabled={savingCustom}
              className="col-span-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 sm:col-span-4"
            >
              {savingCustom ? "Saving..." : "Save food"}
            </button>
          </form>
        )}

        {savedFoods.length === 0 ? (
          <p className="text-sm text-gray-500">No saved foods yet — search above, import your reference foods, or add a custom one.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {savedFoods.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-gray-500">
                    Per {f.servingSize}
                    {f.servingUnit}: {Math.round(f.nutrients.calories)} kcal · P
                    {Math.round(f.nutrients.protein)}g · F{Math.round(f.nutrients.fat)}g · C
                    {Math.round(f.nutrients.carbs)}g
                    {f.costInr != null && ` · ₹${f.costInr}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={deletingId !== null}
                  className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === f.id ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
