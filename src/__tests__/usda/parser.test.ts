import { describe, it, expect } from "vitest";
import { parseSearchFood, parseFoodDetail } from "@/lib/usda/parser";
import type { FdcSearchFood, FdcFoodDetail } from "@/lib/usda/client";

// ── parseSearchFood ──────────────────────────────────────────────────────────

describe("parseSearchFood", () => {
  const baseFood: FdcSearchFood = {
    fdcId: 171534,
    description: "Chicken, broilers or fryers, breast, meat only, raw",
    dataType: "SR Legacy",
    foodCategory: "Poultry Products",
    foodNutrients: [
      { nutrientId: 1003, nutrientName: "Protein", unitName: "G", value: 23.1 },
      { nutrientId: 1004, nutrientName: "Total lipid (fat)", unitName: "G", value: 1.24 },
      { nutrientId: 1008, nutrientName: "Energy", unitName: "KCAL", value: 110 },
      { nutrientId: 9999, nutrientName: "Unknown nutrient", unitName: "G", value: 0.5 },
    ],
  };

  it("maps known nutrient IDs to ParsedNutrient", () => {
    const result = parseSearchFood(baseFood);
    expect(result.fdcId).toBe(171534);
    expect(result.description).toBe(baseFood.description);
    expect(result.foodCategory).toBe("Poultry Products");
    expect(result.nutrients).toHaveLength(3); // 9999 filtered out
  });

  it("filters out unknown nutrient IDs", () => {
    const result = parseSearchFood(baseFood);
    expect(result.nutrients.every((n) => n.id !== 9999)).toBe(true);
  });

  it("sets valuePer100g from search response", () => {
    const result = parseSearchFood(baseFood);
    const protein = result.nutrients.find((n) => n.id === 1003);
    expect(protein?.valuePer100g).toBe(23.1);
  });

  it("sets foodCategory to null when absent", () => {
    const food: FdcSearchFood = { ...baseFood, foodCategory: undefined };
    expect(parseSearchFood(food).foodCategory).toBeNull();
  });
});

// ── parseFoodDetail ──────────────────────────────────────────────────────────

describe("parseFoodDetail", () => {
  const baseDetail: FdcFoodDetail = {
    fdcId: 171534,
    description: "Chicken, broilers or fryers, breast, meat only, raw",
    dataType: "SR Legacy",
    foodCategory: "Poultry Products",
    foodNutrients: [
      { nutrient: { id: 1003, name: "Protein", unitName: "G" }, amount: 23.1 },
      { nutrient: { id: 1087, name: "Calcium, Ca", unitName: "MG" }, amount: 7 },
      { nutrient: { id: 9999, name: "Unknown", unitName: "G" }, amount: 0 },
    ],
  };

  it("maps known nutrient IDs to ParsedNutrient", () => {
    const result = parseFoodDetail(baseDetail);
    expect(result.nutrients).toHaveLength(2);
  });

  it("filters out unknown nutrient IDs", () => {
    const result = parseFoodDetail(baseDetail);
    expect(result.nutrients.every((n) => n.id !== 9999)).toBe(true);
  });

  it("sets valuePer100g from detail amount field", () => {
    const result = parseFoodDetail(baseDetail);
    const calcium = result.nutrients.find((n) => n.id === 1087);
    expect(calcium?.valuePer100g).toBe(7);
    expect(calcium?.unit).toBe("mg");
    expect(calcium?.category).toBe("mineral");
  });

  it("handles foodCategory as string", () => {
    const result = parseFoodDetail(baseDetail);
    expect(result.foodCategory).toBe("Poultry Products");
  });

  it("handles foodCategory as object with description", () => {
    const food: FdcFoodDetail = {
      ...baseDetail,
      foodCategory: { description: "Dairy and Egg Products" },
    };
    expect(parseFoodDetail(food).foodCategory).toBe("Dairy and Egg Products");
  });

  it("handles missing foodCategory", () => {
    const food: FdcFoodDetail = { ...baseDetail, foodCategory: undefined };
    expect(parseFoodDetail(food).foodCategory).toBeNull();
  });
});
