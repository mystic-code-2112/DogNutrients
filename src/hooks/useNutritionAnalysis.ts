"use client";

import { useMemo } from "react";
import { useRecipeStore } from "@/stores/recipeStore";
import { calculateRecipeNutrition } from "@/lib/nutrition/engine";
import { dbNutrientsToValues } from "@/lib/nutrition/nutrient-id-map";
import type { DogProfile, RecipeItemForEngine } from "@/lib/nutrition/types";

export function useNutritionAnalysis(dog: DogProfile) {
  const { recipe } = useRecipeStore();

  return useMemo(() => {
    if (!recipe || recipe.items.length === 0) return null;

    const engineItems: RecipeItemForEngine[] = recipe.items
      .filter((item) => item.ingredient !== null)
      .map((item) => {
        const nutrients = dbNutrientsToValues(
          (item.ingredient as unknown as { nutrients?: Array<{ nutrientId: number; amount: number }> })?.nutrients ?? []
        );
        return {
          weightG: item.weightG,
          cookingMethod: recipe.cookingMethod,
          nutrients,
          moisturePct: nutrients.moistureG, // moistureG per 100g = moisturePct
        };
      });

    if (engineItems.length === 0) return null;

    try {
      return calculateRecipeNutrition(engineItems, dog);
    } catch {
      return null;
    }
  }, [recipe, dog]);
}
