import type { NutrientValues, CookingMethod } from "./types";
import { zeroNutrients } from "./nutrient-id-map";

/**
 * Convert as-fed nutrient values to dry-matter basis.
 * moisturePct: 0–100 (e.g. chicken breast ≈ 74%)
 */
export function asFedToDMB(
  asFed: NutrientValues,
  moisturePct: number
): NutrientValues {
  const dryMatterFraction = 1 - moisturePct / 100;
  if (dryMatterFraction <= 0) return { ...asFed };

  const factor = 1 / dryMatterFraction;
  const dmb = { ...asFed };
  for (const key of Object.keys(dmb) as Array<keyof NutrientValues>) {
    (dmb as unknown as Record<string, number>)[key] *= factor;
  }
  // Moisture on a DMB is 0 by definition
  dmb.moistureG = 0;
  return dmb;
}

/** Moisture lost during cooking (percentage points subtracted). */
const MOISTURE_LOSS: Record<CookingMethod, number> = {
  RAW:             0,
  LIGHTLY_COOKED:  5,
  FULLY_COOKED:    10,
  PRESSURE_COOKED: 8,
};

/** Thiamine (B1) retention factors by cooking method. */
const THIAMIN_RETENTION: Record<CookingMethod, number> = {
  RAW:             1.0,
  LIGHTLY_COOKED:  0.85,
  FULLY_COOKED:    0.70,
  PRESSURE_COOKED: 0.60,
};

/** Folate retention factors by cooking method. */
const FOLATE_RETENTION: Record<CookingMethod, number> = {
  RAW:             1.0,
  LIGHTLY_COOKED:  0.85,
  FULLY_COOKED:    0.65,
  PRESSURE_COOKED: 0.50,
};

/**
 * Apply cooking corrections to a scaled nutrient set:
 * - moisture concentration (nutrients increase per gram as water evaporates)
 * - thiamine and folate degradation
 */
export function applyCookingCorrections(
  nutrients: NutrientValues,
  rawMoisturePct: number,
  method: CookingMethod
): NutrientValues {
  if (method === "RAW") return nutrients;

  const cookedMoisture = Math.max(0, rawMoisturePct - MOISTURE_LOSS[method]);
  const concentrationFactor =
    rawMoisturePct < 100
      ? (100 - rawMoisturePct) / (100 - cookedMoisture)
      : 1;

  const corrected = { ...nutrients };
  // Scale all nutrients for moisture concentration
  for (const key of Object.keys(corrected) as Array<keyof NutrientValues>) {
    (corrected as unknown as Record<string, number>)[key] *= concentrationFactor;
  }
  // Re-set moisture to cooked level (cooked weight proportion)
  corrected.moistureG = cookedMoisture * concentrationFactor;

  // Apply vitamin degradation
  corrected.thiaminMg *= THIAMIN_RETENTION[method];
  corrected.folateUg  *= FOLATE_RETENTION[method];

  return corrected;
}

/**
 * Weighted average moisture across all recipe items.
 * Used to convert combined totals to DMB.
 */
export function weightedAverageMoisture(
  items: Array<{ weightG: number; moisturePct: number }>
): number {
  const totalWeight = items.reduce((s, i) => s + i.weightG, 0);
  if (totalWeight === 0) return 0;
  return (
    items.reduce((s, i) => s + i.moisturePct * i.weightG, 0) / totalWeight
  );
}

/** Add two NutrientValues objects together. */
export function addNutrients(a: NutrientValues, b: NutrientValues): NutrientValues {
  const result = zeroNutrients();
  for (const key of Object.keys(result) as Array<keyof NutrientValues>) {
    (result as unknown as Record<string, number>)[key] =
      (a as unknown as Record<string, number>)[key] + (b as unknown as Record<string, number>)[key];
  }
  return result;
}

/** Scale NutrientValues (per 100g) to a given weight in grams. */
export function scaleNutrients(per100g: NutrientValues, weightG: number): NutrientValues {
  const factor = weightG / 100;
  const scaled = { ...per100g };
  for (const key of Object.keys(scaled) as Array<keyof NutrientValues>) {
    (scaled as unknown as Record<string, number>)[key] *= factor;
  }
  return scaled;
}
