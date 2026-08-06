"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addFood, deleteFood, listFoods } from "@/lib/firestore/foods";
import type { Food, Nutrients } from "@/types";

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
};

export default function FoodsPage() {
  const { user } = useAuth();
  const [savedFoods, setSavedFoods] = useState<Food[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [customFood, setCustomFood] = useState(EMPTY_CUSTOM);
  const [showCustomForm, setShowCustomForm] = useState(false);

  async function refreshSavedFoods() {
    if (!user) return;
    setSavedFoods(await listFoods(user.uid));
  }

  useEffect(() => {
    refreshSavedFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
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
    if (!user) return;
    await addFood(user.uid, {
      name: result.brandName ? `${result.name} (${result.brandName})` : result.name,
      source: "usda",
      fdcId: result.fdcId,
      servingSize: result.servingSize,
      servingUnit: result.servingUnit,
      nutrients: result.nutrients,
    });
    await refreshSavedFoods();
  }

  async function handleSaveCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !customFood.name.trim()) return;
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
    });
    setCustomFood(EMPTY_CUSTOM);
    setShowCustomForm(false);
    await refreshSavedFoods();
  }

  async function handleDelete(foodId: string) {
    if (!user) return;
    await deleteFood(user.uid, foodId);
    await refreshSavedFoods();
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-3 text-lg font-semibold">Search USDA food database</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="input"
            placeholder="e.g. chicken breast, banana, oats"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={searching}
            className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {results.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {results.map((r) => (
              <li key={r.fdcId} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
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
                  className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                >
                  Save to library
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My food library</h2>
          <button
            onClick={() => setShowCustomForm((v) => !v)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
          >
            {showCustomForm ? "Cancel" : "+ Add custom food"}
          </button>
        </div>

        {showCustomForm && (
          <form
            onSubmit={handleSaveCustom}
            className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3"
          >
            <input
              className="input col-span-2 sm:col-span-3"
              placeholder="Food name"
              value={customFood.name}
              onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
              required
            />
            <input
              className="input"
              type="number"
              placeholder="Serving size"
              value={customFood.servingSize}
              onChange={(e) =>
                setCustomFood({ ...customFood, servingSize: Number(e.target.value) })
              }
            />
            <input
              className="input"
              placeholder="Unit (g, ml, cup...)"
              value={customFood.servingUnit}
              onChange={(e) => setCustomFood({ ...customFood, servingUnit: e.target.value })}
            />
            <input
              className="input"
              type="number"
              placeholder="Calories"
              value={customFood.calories}
              onChange={(e) => setCustomFood({ ...customFood, calories: Number(e.target.value) })}
            />
            <input
              className="input"
              type="number"
              placeholder="Protein (g)"
              value={customFood.protein}
              onChange={(e) => setCustomFood({ ...customFood, protein: Number(e.target.value) })}
            />
            <input
              className="input"
              type="number"
              placeholder="Fat (g)"
              value={customFood.fat}
              onChange={(e) => setCustomFood({ ...customFood, fat: Number(e.target.value) })}
            />
            <input
              className="input"
              type="number"
              placeholder="Carbs (g)"
              value={customFood.carbs}
              onChange={(e) => setCustomFood({ ...customFood, carbs: Number(e.target.value) })}
            />
            <button
              type="submit"
              className="col-span-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 sm:col-span-3"
            >
              Save food
            </button>
          </form>
        )}

        {savedFoods.length === 0 ? (
          <p className="text-sm text-gray-500">No saved foods yet — search above or add a custom one.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {savedFoods.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-gray-500">
                    Per {f.servingSize}
                    {f.servingUnit}: {Math.round(f.nutrients.calories)} kcal · P
                    {Math.round(f.nutrients.protein)}g · F{Math.round(f.nutrients.fat)}g · C
                    {Math.round(f.nutrients.carbs)}g
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
