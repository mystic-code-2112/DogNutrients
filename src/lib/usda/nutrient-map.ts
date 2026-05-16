/**
 * Maps USDA FoodData Central nutrient IDs to canonical names used
 * throughout this app. Only nutrients relevant to canine nutrition are
 * included (AAFCO / NRC standards).
 */

export interface NutrientMeta {
  id: number;
  name: string;
  unit: string;
  category: "macro" | "mineral" | "vitamin" | "amino_acid" | "fatty_acid";
}

export const NUTRIENT_MAP: NutrientMeta[] = [
  // ── Macros ────────────────────────────────────────────────────────────────
  { id: 1008, name: "Energy",            unit: "kcal", category: "macro" },
  { id: 1003, name: "Protein",           unit: "g",    category: "macro" },
  { id: 1004, name: "Fat",               unit: "g",    category: "macro" },
  { id: 1005, name: "Carbohydrate",      unit: "g",    category: "macro" },
  { id: 1079, name: "Fiber",             unit: "g",    category: "macro" },
  { id: 1051, name: "Moisture",          unit: "g",    category: "macro" },
  { id: 1007, name: "Ash",               unit: "g",    category: "macro" },

  // ── Minerals ──────────────────────────────────────────────────────────────
  { id: 1087, name: "Calcium",           unit: "mg",   category: "mineral" },
  { id: 1091, name: "Phosphorus",        unit: "mg",   category: "mineral" },
  { id: 1092, name: "Potassium",         unit: "mg",   category: "mineral" },
  { id: 1093, name: "Sodium",            unit: "mg",   category: "mineral" },
  { id: 1090, name: "Magnesium",         unit: "mg",   category: "mineral" },
  { id: 1089, name: "Iron",              unit: "mg",   category: "mineral" },
  { id: 1095, name: "Zinc",              unit: "mg",   category: "mineral" },
  { id: 1098, name: "Copper",            unit: "mg",   category: "mineral" },
  { id: 1101, name: "Manganese",         unit: "mg",   category: "mineral" },
  { id: 1103, name: "Selenium",          unit: "µg",   category: "mineral" },
  { id: 1100, name: "Iodine",            unit: "µg",   category: "mineral" },

  // ── Vitamins ──────────────────────────────────────────────────────────────
  { id: 1104, name: "Vitamin A",         unit: "IU",   category: "vitamin" },
  { id: 1110, name: "Vitamin D",         unit: "IU",   category: "vitamin" },
  { id: 1109, name: "Vitamin E",         unit: "mg",   category: "vitamin" },
  { id: 1185, name: "Vitamin K",         unit: "µg",   category: "vitamin" },
  { id: 1165, name: "Thiamin (B1)",      unit: "mg",   category: "vitamin" },
  { id: 1166, name: "Riboflavin (B2)",   unit: "mg",   category: "vitamin" },
  { id: 1167, name: "Niacin (B3)",       unit: "mg",   category: "vitamin" },
  { id: 1170, name: "Pantothenic Acid",  unit: "mg",   category: "vitamin" },
  { id: 1175, name: "Vitamin B6",        unit: "mg",   category: "vitamin" },
  { id: 1177, name: "Folate",            unit: "µg",   category: "vitamin" },
  { id: 1178, name: "Vitamin B12",       unit: "µg",   category: "vitamin" },
  { id: 1180, name: "Choline",           unit: "mg",   category: "vitamin" },

  // ── Fatty Acids ───────────────────────────────────────────────────────────
  { id: 1269, name: "Linoleic Acid (n-6)", unit: "g",  category: "fatty_acid" },
  { id: 1404, name: "ALA (n-3)",           unit: "g",  category: "fatty_acid" },
  { id: 1278, name: "EPA (20:5 n-3)",      unit: "g",  category: "fatty_acid" },
  { id: 1272, name: "DHA (22:6 n-3)",      unit: "g",  category: "fatty_acid" },

  // ── Amino Acids ───────────────────────────────────────────────────────────
  { id: 1210, name: "Tryptophan",        unit: "g",    category: "amino_acid" },
  { id: 1211, name: "Threonine",         unit: "g",    category: "amino_acid" },
  { id: 1212, name: "Isoleucine",        unit: "g",    category: "amino_acid" },
  { id: 1213, name: "Leucine",           unit: "g",    category: "amino_acid" },
  { id: 1214, name: "Lysine",            unit: "g",    category: "amino_acid" },
  { id: 1215, name: "Methionine",        unit: "g",    category: "amino_acid" },
  { id: 1216, name: "Cystine",           unit: "g",    category: "amino_acid" },
  { id: 1217, name: "Phenylalanine",     unit: "g",    category: "amino_acid" },
  { id: 1219, name: "Valine",            unit: "g",    category: "amino_acid" },
  { id: 1220, name: "Arginine",          unit: "g",    category: "amino_acid" },
  { id: 1221, name: "Histidine",         unit: "g",    category: "amino_acid" },
];

/** Quick lookup: nutrientId → NutrientMeta */
export const NUTRIENT_ID_MAP = new Map<number, NutrientMeta>(
  NUTRIENT_MAP.map((n) => [n.id, n])
);

/** Nutrient IDs we care about (for filtering FDC responses) */
export const WANTED_NUTRIENT_IDS = new Set<number>(NUTRIENT_MAP.map((n) => n.id));
