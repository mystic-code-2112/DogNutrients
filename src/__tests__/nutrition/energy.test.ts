import { describe, it, expect } from "vitest";
import { calculateRER, calculateDER, calculateME } from "@/lib/nutrition/energy";
import type { DogProfile } from "@/lib/nutrition/types";

const adultDog: DogProfile = {
  id: "test",
  name: "Rex",
  breed: null,
  weightKg: 25,
  ageMonths: 36,
  sex: "MALE",
  lifeStage: "ADULT",
  isNeutered: true,
  activityLevel: "MODERATE",
  healthConditions: [],
  notes: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

describe("calculateRER", () => {
  it("returns 70 × W^0.75", () => {
    expect(calculateRER(10)).toBeCloseTo(70 * Math.pow(10, 0.75), 2);
  });

  it("25 kg dog ≈ 840 kcal/day", () => {
    expect(calculateRER(25)).toBeCloseTo(70 * Math.pow(25, 0.75), 1);
  });
});

describe("calculateDER", () => {
  it("neutered adult moderate dog uses k=1.6", () => {
    const result = calculateDER(adultDog);
    expect(result.kFactor).toBe(1.6);
    expect(result.der).toBeCloseTo(result.rer * 1.6, 5);
  });

  it("puppy under 4mo uses k=3.0", () => {
    const puppy = { ...adultDog, lifeStage: "PUPPY_UNDER_4MO" as const };
    expect(calculateDER(puppy).kFactor).toBe(3.0);
  });

  it("working dog uses k=4.0", () => {
    const working = {
      ...adultDog,
      isNeutered: false,
      activityLevel: "WORKING" as const,
    };
    expect(calculateDER(working).kFactor).toBe(4.0);
  });

  it("obesity health condition overrides to k=1.0", () => {
    const obese = { ...adultDog, healthConditions: ["obesity"] };
    expect(calculateDER(obese).kFactor).toBe(1.0);
  });
});

describe("calculateME", () => {
  it("uses Standard Atwater 4/9/4", () => {
    expect(calculateME(10, 5, 8)).toBeCloseTo(10 * 4 + 5 * 9 + 8 * 4, 5);
  });

  it("zero macros = 0 kcal", () => {
    expect(calculateME(0, 0, 0)).toBe(0);
  });
});
