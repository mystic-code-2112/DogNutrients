/**
 * Transforms raw FDC API responses into the normalized shape used by this app.
 */

import { NUTRIENT_ID_MAP, WANTED_NUTRIENT_IDS } from "./nutrient-map";
import type { FdcSearchFood, FdcFoodDetail } from "./client";

export interface ParsedNutrient {
  id: number;
  name: string;
  unit: string;
  category: "macro" | "mineral" | "vitamin" | "amino_acid" | "fatty_acid";
  valuePer100g: number;
}

export interface ParsedIngredient {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory: string | null;
  nutrients: ParsedNutrient[];
}

// ── Search result (partial nutrients from search endpoint) ───────────────────

export function parseSearchFood(food: FdcSearchFood): ParsedIngredient {
  const nutrients: ParsedNutrient[] = [];

  for (const n of food.foodNutrients) {
    if (!WANTED_NUTRIENT_IDS.has(n.nutrientId)) continue;
    const meta = NUTRIENT_ID_MAP.get(n.nutrientId);
    if (!meta) continue;
    nutrients.push({
      id: meta.id,
      name: meta.name,
      unit: meta.unit,
      category: meta.category,
      valuePer100g: n.value,
    });
  }

  return {
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    foodCategory: food.foodCategory ?? null,
    nutrients,
  };
}

// ── Food detail (full nutrients from detail endpoint) ────────────────────────

export function parseFoodDetail(food: FdcFoodDetail): ParsedIngredient {
  const nutrients: ParsedNutrient[] = [];

  for (const n of food.foodNutrients) {
    if (!WANTED_NUTRIENT_IDS.has(n.nutrient.id)) continue;
    const meta = NUTRIENT_ID_MAP.get(n.nutrient.id);
    if (!meta) continue;
    nutrients.push({
      id: meta.id,
      name: meta.name,
      unit: meta.unit,
      category: meta.category,
      valuePer100g: n.amount,
    });
  }

  const category =
    typeof food.foodCategory === "string"
      ? food.foodCategory
      : food.foodCategory?.description ?? null;

  return {
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    foodCategory: category,
    nutrients,
  };
}
