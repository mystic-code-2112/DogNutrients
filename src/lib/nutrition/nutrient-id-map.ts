import type { IngredientNutrient, NutrientValues } from "./types";

/** Maps USDA FDC nutrient IDs to NutrientValues field names. */
export const NUTRIENT_ID_TO_FIELD: Record<number, keyof NutrientValues> = {
  1008: "energyKcal",
  1003: "proteinG",
  1004: "fatG",
  1005: "carbsG",
  1079: "fiberG",
  1051: "moistureG",
  1007: "ashG",

  1087: "calciumMg",
  1091: "phosphorusMg",
  1092: "potassiumMg",
  1093: "sodiumMg",
  1090: "magnesiumMg",
  1089: "ironMg",
  1095: "zincMg",
  1098: "copperMg",
  1101: "manganeseMg",
  1103: "seleniumUg",
  1100: "iodineUg",

  1104: "vitaminAIU",
  1110: "vitaminDIU",
  1109: "vitaminEIU",
  1185: "vitaminKUg",
  1165: "thiaminMg",
  1166: "riboflavinMg",
  1167: "niacinMg",
  1170: "pantothenicAcidMg",
  1175: "vitaminB6Mg",
  1177: "folateUg",
  1178: "vitaminB12Ug",
  1180: "cholineMg",

  1269: "omega6LAG",
  1404: "omega3ALAG",
  1278: "omega3EPAG",
  1272: "omega3DHAG",

  1210: "tryptophanG",
  1211: "threonineG",
  1212: "isoleucineG",
  1213: "leucineG",
  1214: "lysineG",
  1215: "methionineG",
  1216: "cystineG",
  1217: "phenylalanineG",
  1219: "valineG",
  1220: "arginineG",
  1221: "histidineG",
};

export function zeroNutrients(): NutrientValues {
  return {
    energyKcal: 0, proteinG: 0, fatG: 0, carbsG: 0, fiberG: 0,
    moistureG: 0, ashG: 0,
    calciumMg: 0, phosphorusMg: 0, potassiumMg: 0, sodiumMg: 0,
    magnesiumMg: 0, ironMg: 0, zincMg: 0, copperMg: 0, manganeseMg: 0,
    seleniumUg: 0, iodineUg: 0,
    vitaminAIU: 0, vitaminDIU: 0, vitaminEIU: 0, vitaminKUg: 0,
    thiaminMg: 0, riboflavinMg: 0, niacinMg: 0, pantothenicAcidMg: 0,
    vitaminB6Mg: 0, folateUg: 0, vitaminB12Ug: 0, cholineMg: 0,
    omega6LAG: 0, omega3ALAG: 0, omega3EPAG: 0, omega3DHAG: 0,
    tryptophanG: 0, threonineG: 0, isoleucineG: 0, leucineG: 0,
    lysineG: 0, methionineG: 0, cystineG: 0, phenylalanineG: 0,
    valineG: 0, arginineG: 0, histidineG: 0,
  };
}

export type NutrientGroup = "Macros" | "Minerals" | "Vitamins" | "Fatty Acids" | "Amino Acids";

export interface MissingNutrient {
  field: keyof NutrientValues;
  label: string;
  group: NutrientGroup;
}

const NUTRIENT_FIELD_META: Record<keyof NutrientValues, { label: string; group: NutrientGroup }> = {
  energyKcal:        { label: "Energy",              group: "Macros" },
  proteinG:          { label: "Protein",              group: "Macros" },
  fatG:              { label: "Fat",                  group: "Macros" },
  carbsG:            { label: "Carbohydrates",        group: "Macros" },
  fiberG:            { label: "Fiber",                group: "Macros" },
  moistureG:         { label: "Moisture",             group: "Macros" },
  ashG:              { label: "Ash",                  group: "Macros" },
  calciumMg:         { label: "Calcium",              group: "Minerals" },
  phosphorusMg:      { label: "Phosphorus",           group: "Minerals" },
  potassiumMg:       { label: "Potassium",            group: "Minerals" },
  sodiumMg:          { label: "Sodium",               group: "Minerals" },
  magnesiumMg:       { label: "Magnesium",            group: "Minerals" },
  ironMg:            { label: "Iron",                 group: "Minerals" },
  zincMg:            { label: "Zinc",                 group: "Minerals" },
  copperMg:          { label: "Copper",               group: "Minerals" },
  manganeseMg:       { label: "Manganese",            group: "Minerals" },
  seleniumUg:        { label: "Selenium",             group: "Minerals" },
  iodineUg:          { label: "Iodine",               group: "Minerals" },
  vitaminAIU:        { label: "Vitamin A",            group: "Vitamins" },
  vitaminDIU:        { label: "Vitamin D",            group: "Vitamins" },
  vitaminEIU:        { label: "Vitamin E",            group: "Vitamins" },
  vitaminKUg:        { label: "Vitamin K",            group: "Vitamins" },
  thiaminMg:         { label: "Thiamin (B1)",         group: "Vitamins" },
  riboflavinMg:      { label: "Riboflavin (B2)",      group: "Vitamins" },
  niacinMg:          { label: "Niacin (B3)",          group: "Vitamins" },
  pantothenicAcidMg: { label: "Pantothenic Acid (B5)", group: "Vitamins" },
  vitaminB6Mg:       { label: "Vitamin B6",           group: "Vitamins" },
  folateUg:          { label: "Folate (B9)",          group: "Vitamins" },
  vitaminB12Ug:      { label: "Vitamin B12",          group: "Vitamins" },
  cholineMg:         { label: "Choline",              group: "Vitamins" },
  omega6LAG:         { label: "Omega-6 (LA)",         group: "Fatty Acids" },
  omega3ALAG:        { label: "Omega-3 (ALA)",        group: "Fatty Acids" },
  omega3EPAG:        { label: "Omega-3 (EPA)",        group: "Fatty Acids" },
  omega3DHAG:        { label: "Omega-3 (DHA)",        group: "Fatty Acids" },
  tryptophanG:       { label: "Tryptophan",           group: "Amino Acids" },
  threonineG:        { label: "Threonine",            group: "Amino Acids" },
  isoleucineG:       { label: "Isoleucine",           group: "Amino Acids" },
  leucineG:          { label: "Leucine",              group: "Amino Acids" },
  lysineG:           { label: "Lysine",               group: "Amino Acids" },
  methionineG:       { label: "Methionine",           group: "Amino Acids" },
  cystineG:          { label: "Cystine",              group: "Amino Acids" },
  phenylalanineG:    { label: "Phenylalanine",        group: "Amino Acids" },
  valineG:           { label: "Valine",               group: "Amino Acids" },
  arginineG:         { label: "Arginine",             group: "Amino Acids" },
  histidineG:        { label: "Histidine",            group: "Amino Acids" },
};

const FIELD_TO_NUTRIENT_ID = Object.fromEntries(
  Object.entries(NUTRIENT_ID_TO_FIELD).map(([id, field]) => [field, Number(id)])
) as Record<keyof NutrientValues, number>;

// Energy is always derived via Atwater (protein/fat/carbs) — never used directly.
const DERIVED_FIELDS = new Set<keyof NutrientValues>(["energyKcal"]);

export function getMissingNutrients(nutrients: IngredientNutrient[]): MissingNutrient[] {
  // Map nutrientId → amount so we can detect both absent and zero-value nutrients
  const amountById = new Map(nutrients.map((n) => [n.nutrientId, n.amount]));
  const missing: MissingNutrient[] = [];
  for (const field of Object.keys(NUTRIENT_FIELD_META) as Array<keyof NutrientValues>) {
    if (DERIVED_FIELDS.has(field)) continue;
    const id = FIELD_TO_NUTRIENT_ID[field];
    if (id === undefined) continue;
    const amount = amountById.get(id);
    // Flag as missing if not reported at all, or reported as exactly 0
    if (amount === undefined || amount === 0) {
      missing.push({ field, ...NUTRIENT_FIELD_META[field] });
    }
  }
  return missing;
}

/** Convert IngredientNutrient[] rows from DB into a NutrientValues object. */
export function dbNutrientsToValues(
  rows: Array<{ nutrientId: number; amount: number }>
): NutrientValues {
  const v = zeroNutrients();
  for (const row of rows) {
    const field = NUTRIENT_ID_TO_FIELD[row.nutrientId];
    if (field) {
      // USDA stores Vitamin E as mg alpha-tocopherol; convert to IU (1 mg = 1.49 IU natural form)
      const amount = row.nutrientId === 1109 ? row.amount * 1.49 : row.amount;
      (v as unknown as Record<string, number>)[field] = amount;
    }
  }
  return v;
}
