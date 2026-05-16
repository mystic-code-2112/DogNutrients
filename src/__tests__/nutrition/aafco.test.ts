import { describe, it, expect } from "vitest";
import { checkAafcoCompliance, scoreAminoAcids } from "@/lib/nutrition/aafco";
import { zeroNutrients } from "@/lib/nutrition/nutrient-id-map";

function makeNutrients(overrides = {}) {
  return { ...zeroNutrients(), ...overrides };
}

describe("checkAafcoCompliance", () => {
  it("all zeros → all DEFICIENT", () => {
    const statuses = checkAafcoCompliance(makeNutrients(), "ADULT_MAINTENANCE");
    const deficients = statuses.filter((s) => s.status === "DEFICIENT");
    expect(deficients.length).toBeGreaterThan(0);
  });

  it("marks protein as OK when at minimum", () => {
    const n = makeNutrients({ proteinG: 45, energyKcal: 1000 });
    const statuses = checkAafcoCompliance(n, "ADULT_MAINTENANCE");
    const protein = statuses.find((s) => s.nutrient === "proteinG");
    expect(protein?.status).toBe("OK");
  });

  it("marks calcium as DEFICIENT when below minimum", () => {
    const n = makeNutrients({ calciumMg: 500 });
    const statuses = checkAafcoCompliance(n, "ADULT_MAINTENANCE");
    const calcium = statuses.find((s) => s.nutrient === "calciumMg");
    expect(calcium?.status).toBe("DEFICIENT");
  });

  it("marks vitaminA as EXCESSIVE when above maxSafe", () => {
    const n = makeNutrients({ vitaminAIU: 100000 });
    const statuses = checkAafcoCompliance(n, "ADULT_MAINTENANCE");
    const vitA = statuses.find((s) => s.nutrient === "vitaminAIU");
    expect(vitA?.status).toBe("EXCESSIVE");
  });

  it("uses higher growth minimums for GROWTH_REPRODUCTION", () => {
    const n = makeNutrients({ proteinG: 50 }); // 50 > adult min (45) but < growth min (56.3)
    const adult = checkAafcoCompliance(n, "ADULT_MAINTENANCE");
    const growth = checkAafcoCompliance(n, "GROWTH_REPRODUCTION");
    const adultProtein = adult.find((s) => s.nutrient === "proteinG");
    const growthProtein = growth.find((s) => s.nutrient === "proteinG");
    expect(adultProtein?.status).toBe("OK");
    expect(growthProtein?.status).toBe("DEFICIENT");
  });
});

describe("scoreAminoAcids", () => {
  it("perfect amino acids = score 100", () => {
    const n = makeNutrients({
      arginineG: 2, histidineG: 0.6, isoleucineG: 1.2, leucineG: 2.2,
      lysineG: 1.0, methionineG: 1.0, phenylalanineG: 2.0, threonineG: 1.3,
      tryptophanG: 0.3, valineG: 1.5,
    });
    const result = scoreAminoAcids(n, "ADULT_MAINTENANCE");
    expect(result.score).toBe(100);
    expect(result.limitingAmino).toBeNull();
  });

  it("zero amino acids = score 0 with limiting amino", () => {
    const result = scoreAminoAcids(makeNutrients(), "ADULT_MAINTENANCE");
    expect(result.score).toBe(0);
    expect(result.limitingAmino).not.toBeNull();
  });
});
