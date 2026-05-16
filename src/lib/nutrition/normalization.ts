import type { NutrientValues } from "./types";
import { zeroNutrients } from "./nutrient-id-map";

/**
 * Normalize a NutrientValues total to a per-1000-kcal basis.
 * This is the canonical comparison basis for AAFCO/NRC standards.
 */
export function normalizePer1000Kcal(
  totals: NutrientValues,
  totalKcal: number
): NutrientValues {
  if (totalKcal <= 0) return zeroNutrients();
  const factor = 1000 / totalKcal;
  const result = { ...totals };
  for (const key of Object.keys(result) as Array<keyof NutrientValues>) {
    (result as unknown as Record<string, number>)[key] *= factor;
  }
  return result;
}
