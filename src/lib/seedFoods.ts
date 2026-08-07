import type { Food } from "@/types";

// Your own measured/priced reference foods. Amount/serving matches how you
// actually buy and cook these, so quantity "1" in the diary means exactly
// this serving. Costs are in INR. Add more here any time.
export const SEED_FOODS: Omit<Food, "id" | "createdAt">[] = [
  // Proteins - non-veg
  { name: "Chicken breast (100g raw)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 165, protein: 31, fat: 3.6, carbs: 0 }, costInr: 24 },
  { name: "Egg, whole (1)", source: "custom", servingSize: 1, servingUnit: "egg", nutrients: { calories: 70, protein: 6.3, fat: 5, carbs: 0.4 }, costInr: 8 },
  { name: "Egg white only (1)", source: "custom", servingSize: 1, servingUnit: "egg", nutrients: { calories: 17, protein: 3.6, fat: 0.1, carbs: 0.2 }, costInr: 8 },

  // Proteins - veg
  { name: "Soya chunks (100g dry)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 345, protein: 52, fat: 0.5, carbs: 33 }, costInr: 17.5 },
  { name: "Paneer (100g)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 265, protein: 18, fat: 21, carbs: 1.2 }, costInr: 35 },
  { name: "Dal, toor/chana (100g raw)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 340, protein: 22, fat: 1.5, carbs: 60 }, costInr: 15 },
  { name: "Kabuli chana (100g raw)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 364, protein: 19, fat: 6, carbs: 61 }, costInr: 19 },
  { name: "Safed matar (100g raw)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 350, protein: 23, fat: 1.2, carbs: 60 }, costInr: 11 },
  { name: "Rajma (100g raw)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 335, protein: 24, fat: 0.8, carbs: 60 }, costInr: 15 },
  { name: "Sprouts, moong (100g)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 30, protein: 3, fat: 0.2, carbs: 6 }, costInr: 8 },

  // Grains & staples
  { name: "Basmati rice (100g raw)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 345, protein: 7.5, fat: 0.6, carbs: 78 }, costInr: 7.5 },
  { name: "Atta / wheat flour (100g)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 340, protein: 12, fat: 1.7, carbs: 71 }, costInr: 7 },
  { name: "Roti, medium (1, ~35g atta)", source: "custom", servingSize: 1, servingUnit: "roti", nutrients: { calories: 110, protein: 3.7, fat: 0.6, carbs: 23 }, costInr: 2 },
  { name: "Oats (100g dry)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 380, protein: 13, fat: 7, carbs: 67 }, costInr: 15 },

  // Dairy
  { name: "Milk, full cream (200ml)", source: "custom", servingSize: 200, servingUnit: "ml", nutrients: { calories: 120, protein: 6.5, fat: 6.5, carbs: 9.5 }, costInr: 20 },
  { name: "Curd (100g)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 60, protein: 3.5, fat: 4, carbs: 3 }, costInr: 10 },

  // Fruits & fats
  { name: "Banana, medium (1)", source: "custom", servingSize: 1, servingUnit: "banana", nutrients: { calories: 100, protein: 1.3, fat: 0.3, carbs: 26 }, costInr: 6 },
  { name: "Peanut butter (15g / 1 tbsp)", source: "custom", servingSize: 15, servingUnit: "g", nutrients: { calories: 90, protein: 4, fat: 7.5, carbs: 3 }, costInr: 8 },
  { name: "Mustard oil (1 tbsp / 15ml)", source: "custom", servingSize: 15, servingUnit: "ml", nutrients: { calories: 135, protein: 0, fat: 15, carbs: 0 }, costInr: 2 },
  { name: "Peanuts, raw (30g)", source: "custom", servingSize: 30, servingUnit: "g", nutrients: { calories: 170, protein: 7.5, fat: 14, carbs: 5 }, costInr: 6 },

  // Vegetables
  { name: "Mixed green sabzi, cooked (200g)", source: "custom", servingSize: 200, servingUnit: "g", nutrients: { calories: 80, protein: 3, fat: 4, carbs: 8 } },
  { name: "Onion / tomato (100g)", source: "custom", servingSize: 100, servingUnit: "g", nutrients: { calories: 20, protein: 1, fat: 0, carbs: 4 } },
  { name: "Salad, cucumber etc. (150g)", source: "custom", servingSize: 150, servingUnit: "g", nutrients: { calories: 25, protein: 1, fat: 0, carbs: 5 } },
];
