import { NextRequest, NextResponse } from "next/server";

const NUTRIENT_MAP: Record<number, string> = {
  1008: "calories",
  1003: "protein",
  1004: "fat",
  1005: "carbs",
  1079: "fiber",
  2000: "sugar",
  1093: "sodium",
  1087: "calcium",
  1089: "iron",
  1092: "potassium",
  1162: "vitaminC",
  1114: "vitaminD",
  1109: "vitaminE",
  1185: "vitaminK",
  1165: "thiamin",
  1166: "riboflavin",
  1167: "niacin",
  1175: "vitaminB6",
  1178: "vitaminB12",
  1177: "folate",
  1090: "magnesium",
  1095: "zinc",
};

interface FdcNutrient {
  nutrientId: number;
  value: number;
}

interface FdcFood {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FdcNutrient[];
}

function mapNutrients(foodNutrients: FdcNutrient[]) {
  const nutrients: Record<string, number> = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  };
  for (const n of foodNutrients) {
    const key = NUTRIENT_MAP[n.nutrientId];
    if (key) nutrients[key] = n.value;
  }
  return nutrients;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "USDA_FDC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const query = req.nextUrl.searchParams.get("query");
  const fdcId = req.nextUrl.searchParams.get("fdcId");

  try {
    if (fdcId) {
      const res = await fetch(
        `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`
      );
      if (!res.ok) throw new Error(`USDA API error: ${res.status}`);
      const food: FdcFood = await res.json();
      return NextResponse.json({
        fdcId: food.fdcId,
        name: food.description,
        servingSize: food.servingSize ?? 100,
        servingUnit: food.servingSizeUnit ?? "g",
        nutrients: mapNutrients(food.foodNutrients),
      });
    }

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(
        query
      )}&pageSize=25&dataType=Foundation,SR%20Legacy,Branded`
    );
    if (!res.ok) throw new Error(`USDA API error: ${res.status}`);
    const data = await res.json();
    const foods: FdcFood[] = data.foods ?? [];

    const results = foods.map((food) => ({
      fdcId: food.fdcId,
      name: food.description,
      brandName: food.brandName ?? food.brandOwner,
      servingSize: food.servingSize ?? 100,
      servingUnit: food.servingSizeUnit ?? "g",
      nutrients: mapNutrients(food.foodNutrients ?? []),
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Failed to reach USDA FoodData Central." }, { status: 502 });
  }
}
