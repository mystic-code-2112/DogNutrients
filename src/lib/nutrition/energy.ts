import type { DogProfile, DERResult } from "./types";

/** Resting Energy Requirement (kcal/day) — Kleiber formula. */
export function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

/** Daily Energy Requirement = RER × life-stage/activity k-factor. */
export function calculateDER(dog: DogProfile): DERResult {
  const rer = calculateRER(dog.weightKg);
  const kFactor = getKFactor(dog);
  return {
    rer,
    der: rer * kFactor,
    kFactor,
    method: `${dog.lifeStage}${dog.isNeutered ? " neutered" : ""}`,
  };
}

function getKFactor(dog: DogProfile): number {
  const { lifeStage, isNeutered, activityLevel, healthConditions } = dog;

  if (healthConditions.includes("obesity") || healthConditions.includes("weight_loss"))
    return 1.0;
  if (healthConditions.includes("obesity_prone")) return 1.2;

  switch (lifeStage) {
    case "PUPPY_UNDER_4MO": return 3.0;
    case "PUPPY_OVER_4MO":  return 2.0;
    case "SENIOR":          return 1.4;
    case "PREGNANT":        return 1.8;
    case "LACTATING":       return 2.5;
    case "ADULT":
      if (activityLevel === "WORKING")       return 4.0;
      if (activityLevel === "HIGHLY_ACTIVE") return 3.0;
      if (activityLevel === "ACTIVE")        return 2.0;
      if (activityLevel === "SEDENTARY")     return isNeutered ? 1.2 : 1.4;
      if (activityLevel === "LESS_ACTIVE")   return isNeutered ? 1.4 : 1.6;
      return isNeutered ? 1.6 : 1.8; // MODERATE
    default: return 1.6;
  }
}

/**
 * Metabolisable Energy via Standard Atwater factors.
 * Use for home-cooked fresh food (most accurate).
 */
export function calculateME(proteinG: number, fatG: number, carbsG: number): number {
  return proteinG * 4.0 + fatG * 9.0 + carbsG * 4.0;
}
