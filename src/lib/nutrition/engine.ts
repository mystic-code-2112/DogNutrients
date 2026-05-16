import type {
  DogProfile,
  RecipeItemForEngine,
  NutritionAnalysisResult,
  NutrientValues,
} from "./types";
import { calculateDER, calculateME } from "./energy";
import {
  scaleNutrients,
  applyCookingCorrections,
  addNutrients,
  weightedAverageMoisture,
  asFedToDMB,
} from "./dmb";
import { normalizePer1000Kcal } from "./normalization";
import { checkAafcoCompliance, scoreAminoAcids, dogLifeStageToAafco } from "./aafco";
import { zeroNutrients } from "./nutrient-id-map";

export function calculateRecipeNutrition(
  items: RecipeItemForEngine[],
  dog: DogProfile
): NutritionAnalysisResult {
  if (items.length === 0) {
    throw new Error("Recipe has no items");
  }

  // Step 1: Scale each ingredient to its weight and apply cooking corrections
  const correctedItems = items.map((item) => {
    const scaled = scaleNutrients(item.nutrients, item.weightG);
    return applyCookingCorrections(scaled, item.moisturePct, item.cookingMethod);
  });

  // Step 2: Sum all nutrients
  const totalAsFed = correctedItems.reduce(
    (acc, n) => addNutrients(acc, n),
    zeroNutrients()
  );

  const totalWeightG = items.reduce((s, i) => s + i.weightG, 0);

  // Step 3: Metabolisable energy (Standard Atwater for home-cooked)
  const totalKcal = calculateME(
    totalAsFed.proteinG,
    totalAsFed.fatG,
    totalAsFed.carbsG
  );

  // Step 4: Dog's daily energy requirement
  const der = calculateDER(dog);

  // Step 5: Dry matter basis
  const avgMoisture = weightedAverageMoisture(
    items.map((i) => ({ weightG: i.weightG, moisturePct: i.moisturePct }))
  );
  const dmb = asFedToDMB(totalAsFed, avgMoisture);

  // Step 6: Per-1000-kcal normalization
  const per1000Kcal = normalizePer1000Kcal(totalAsFed, totalKcal);

  // Step 7: Days this batch covers
  const daysPerBatch = der.der > 0 ? totalKcal / der.der : 0;

  // Step 8: AAFCO compliance
  const aafcoLS = dogLifeStageToAafco(dog.lifeStage);
  const aafco = checkAafcoCompliance(per1000Kcal, aafcoLS);

  // Step 9: Ca:P ratio
  const caPRatio =
    totalAsFed.phosphorusMg > 0
      ? totalAsFed.calciumMg / totalAsFed.phosphorusMg
      : 0;

  // Step 10: Omega-6 to omega-3 ratio
  const totalOmega3 =
    totalAsFed.omega3ALAG + totalAsFed.omega3EPAG + totalAsFed.omega3DHAG;
  const omega6To3Ratio =
    totalOmega3 > 0 ? totalAsFed.omega6LAG / totalOmega3 : Infinity;

  // Step 11: Amino acid completeness
  const aminoAcids = scoreAminoAcids(per1000Kcal, aafcoLS);

  return {
    totalWeightG,
    totalKcal,
    der,
    daysPerBatch,
    asFed: totalAsFed,
    dmb,
    per1000Kcal,
    aafco,
    caPRatio,
    omega6To3Ratio,
    aminoAcids,
  };
}
