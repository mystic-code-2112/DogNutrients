import { describe, it, expect } from "vitest";
import {
  asFedToDMB,
  applyCookingCorrections,
  weightedAverageMoisture,
  scaleNutrients,
  addNutrients,
} from "@/lib/nutrition/dmb";
import { zeroNutrients } from "@/lib/nutrition/nutrient-id-map";

function makeNutrients(overrides: Partial<ReturnType<typeof zeroNutrients>> = {}) {
  return { ...zeroNutrients(), ...overrides };
}

describe("asFedToDMB", () => {
  it("concentrates nutrients when moisture is removed", () => {
    const asFed = makeNutrients({ proteinG: 20, moistureG: 74 });
    const dmb = asFedToDMB(asFed, 74);
    expect(dmb.proteinG).toBeCloseTo(20 / 0.26, 3);
  });

  it("moisture is 0 on DMB", () => {
    const dmb = asFedToDMB(makeNutrients({ moistureG: 74 }), 74);
    expect(dmb.moistureG).toBe(0);
  });

  it("0% moisture returns values unchanged", () => {
    const asFed = makeNutrients({ proteinG: 30 });
    const dmb = asFedToDMB(asFed, 0);
    expect(dmb.proteinG).toBeCloseTo(30, 5);
  });
});

describe("applyCookingCorrections", () => {
  it("RAW returns unchanged", () => {
    const n = makeNutrients({ proteinG: 20, thiaminMg: 1 });
    const result = applyCookingCorrections(n, 74, "RAW");
    expect(result.proteinG).toBeCloseTo(20, 5);
    expect(result.thiaminMg).toBeCloseTo(1, 5);
  });

  it("FULLY_COOKED reduces thiamine by 30%", () => {
    const n = makeNutrients({ thiaminMg: 1, proteinG: 20, moistureG: 74 });
    const result = applyCookingCorrections(n, 74, "FULLY_COOKED");
    // thiamine = 1 * concentrationFactor * 0.70
    expect(result.thiaminMg).toBeLessThan(1);
  });

  it("FULLY_COOKED reduces folate by 35%", () => {
    const n = makeNutrients({ folateUg: 100, moistureG: 74 });
    const result = applyCookingCorrections(n, 74, "FULLY_COOKED");
    expect(result.folateUg).toBeLessThan(100);
  });
});

describe("scaleNutrients", () => {
  it("scales per-100g values to given weight", () => {
    const per100g = makeNutrients({ proteinG: 20 });
    const scaled = scaleNutrients(per100g, 200);
    expect(scaled.proteinG).toBeCloseTo(40, 5);
  });

  it("50g gives half the values", () => {
    const per100g = makeNutrients({ calciumMg: 1000 });
    expect(scaleNutrients(per100g, 50).calciumMg).toBeCloseTo(500, 5);
  });
});

describe("addNutrients", () => {
  it("sums all fields", () => {
    const a = makeNutrients({ proteinG: 10, calciumMg: 200 });
    const b = makeNutrients({ proteinG: 15, calciumMg: 300 });
    const sum = addNutrients(a, b);
    expect(sum.proteinG).toBeCloseTo(25, 5);
    expect(sum.calciumMg).toBeCloseTo(500, 5);
  });
});

describe("weightedAverageMoisture", () => {
  it("returns weighted average", () => {
    const items = [
      { weightG: 100, moisturePct: 74 },
      { weightG: 100, moisturePct: 60 },
    ];
    expect(weightedAverageMoisture(items)).toBeCloseTo(67, 1);
  });

  it("returns 0 for empty array", () => {
    expect(weightedAverageMoisture([])).toBe(0);
  });
});
