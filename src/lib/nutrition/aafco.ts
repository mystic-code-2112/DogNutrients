import type { NutrientValues, NutrientComplianceStatus, AminoAcidResult, LifeStage } from "./types";

export type AafcoLifeStage = "ADULT_MAINTENANCE" | "GROWTH_REPRODUCTION";

export function dogLifeStageToAafco(ls: LifeStage): AafcoLifeStage {
  return ls === "ADULT" || ls === "SENIOR"
    ? "ADULT_MAINTENANCE"
    : "GROWTH_REPRODUCTION";
}

interface AafcoStd {
  field: keyof NutrientValues;
  label: string;
  unit: string;
  adultMin?: number;
  growthMin?: number;
  maxSafe?: number;
}

/**
 * AAFCO Dog Food Nutrient Profiles (2022), per 1000 kcal ME basis.
 * Minerals: mg; Vitamins per IU or mg/µg as noted; Macros: g.
 */
const AAFCO_STANDARDS: AafcoStd[] = [
  // Macros (g/1000kcal)
  { field: "proteinG",          label: "Protein",           unit: "g",   adultMin: 45,     growthMin: 56.3  },
  { field: "fatG",              label: "Fat",               unit: "g",   adultMin: 13.75,  growthMin: 21.3  },
  { field: "omega6LAG",         label: "Linoleic Acid",     unit: "g",   adultMin: 2.8,    growthMin: 3.3   },

  // Minerals (mg/1000kcal)
  { field: "calciumMg",         label: "Calcium (Ca)",      unit: "mg",  adultMin: 1250,   growthMin: 3000,  maxSafe: 6250  },
  { field: "phosphorusMg",      label: "Phosphorus (P)",    unit: "mg",  adultMin: 1000,   growthMin: 2500,  maxSafe: 4000  },
  { field: "potassiumMg",       label: "Potassium (K)",     unit: "mg",  adultMin: 1500,   growthMin: 1500  },
  { field: "sodiumMg",          label: "Sodium (Na)",       unit: "mg",  adultMin: 200,    growthMin: 550   },
  { field: "magnesiumMg",       label: "Magnesium (Mg)",    unit: "mg",  adultMin: 150,    growthMin: 140,   maxSafe: 560   },
  { field: "ironMg",            label: "Iron (Fe)",         unit: "mg",  adultMin: 10,     growthMin: 22,    maxSafe: 110   },
  { field: "copperMg",          label: "Copper (Cu)",       unit: "mg",  adultMin: 1.83,   growthMin: 3.05,  maxSafe: 7.3   },
  { field: "manganeseMg",       label: "Manganese (Mn)",    unit: "mg",  adultMin: 1.4,    growthMin: 1.4   },
  { field: "zincMg",            label: "Zinc (Zn)",         unit: "mg",  adultMin: 20,     growthMin: 25,    maxSafe: 250   },
  { field: "seleniumUg",        label: "Selenium (Se)",     unit: "µg",  adultMin: 87.5,   growthMin: 87.5,  maxSafe: 417   },
  { field: "iodineUg",          label: "Iodine (I)",        unit: "µg",  adultMin: 218.75, growthMin: 218.75 },

  // Vitamins
  { field: "vitaminAIU",        label: "Vitamin A",         unit: "IU",  adultMin: 1515,   growthMin: 1515,  maxSafe: 75045 },
  { field: "vitaminDIU",        label: "Vitamin D",         unit: "IU",  adultMin: 125,    growthMin: 125,   maxSafe: 750   },
  { field: "vitaminEIU",        label: "Vitamin E",         unit: "IU",  adultMin: 12.5,   growthMin: 12.5, maxSafe: 250     },
  { field: "thiaminMg",         label: "Thiamine (B1)",     unit: "mg",  adultMin: 0.56,   growthMin: 0.56  },
  { field: "riboflavinMg",      label: "Riboflavin (B2)",   unit: "mg",  adultMin: 1.3,    growthMin: 1.3   },
  { field: "niacinMg",          label: "Niacin (B3)",       unit: "mg",  adultMin: 3.4,    growthMin: 3.4   },
  { field: "pantothenicAcidMg", label: "Pantothenic Acid",  unit: "mg",  adultMin: 3,      growthMin: 3     },
  { field: "vitaminB6Mg",       label: "Vitamin B6",        unit: "mg",  adultMin: 0.375,  growthMin: 0.375 },
  { field: "folateUg",          label: "Folate",            unit: "µg",  adultMin: 54,     growthMin: 54    },
  { field: "vitaminB12Ug",      label: "Vitamin B12",       unit: "µg",  adultMin: 8.75,   growthMin: 8.75  },
  { field: "cholineMg",         label: "Choline",           unit: "mg",  adultMin: 340,    growthMin: 340   },
];

/** AAFCO amino acid minimums (g/1000 kcal), Adult Maintenance and Growth. */
const AMINO_ACID_STANDARDS: AafcoStd[] = [
  { field: "arginineG",      label: "Arginine",           unit: "g", adultMin: 1.58,  growthMin: 2.1   },
  { field: "histidineG",     label: "Histidine",          unit: "g", adultMin: 0.49,  growthMin: 0.6   },
  { field: "isoleucineG",    label: "Isoleucine",         unit: "g", adultMin: 0.95,  growthMin: 1.23  },
  { field: "leucineG",       label: "Leucine",            unit: "g", adultMin: 1.7,   growthMin: 2.2   },
  { field: "lysineG",        label: "Lysine",             unit: "g", adultMin: 0.78,  growthMin: 1.25  },
  { field: "methionineG",    label: "Methionine+Cystine", unit: "g", adultMin: 0.83,  growthMin: 1.1   },
  { field: "phenylalanineG", label: "Phe+Tyrosine",       unit: "g", adultMin: 1.63,  growthMin: 2.05  },
  { field: "threonineG",     label: "Threonine",          unit: "g", adultMin: 1.04,  growthMin: 1.38  },
  { field: "tryptophanG",    label: "Tryptophan",         unit: "g", adultMin: 0.2,   growthMin: 0.26  },
  { field: "valineG",        label: "Valine",             unit: "g", adultMin: 1.22,  growthMin: 1.58  },
];

function checkStandard(
  per1000Kcal: NutrientValues,
  std: AafcoStd,
  ls: AafcoLifeStage
): NutrientComplianceStatus {
  const actual = (per1000Kcal as unknown as Record<string, number>)[std.field as string] ?? 0;
  const min = ls === "GROWTH_REPRODUCTION" ? std.growthMin : std.adultMin;
  const max = std.maxSafe;

  let status: NutrientComplianceStatus["status"] = "OK";
  if (min !== undefined && actual < min) status = "DEFICIENT";
  else if (max !== undefined && actual > max) status = "EXCESSIVE";
  else if (min !== undefined && actual > min && actual < min * 1.1) status = "WARNING";

  return {
    nutrient: std.field as string,
    label: std.label,
    actual,
    min,
    max,
    unit: std.unit,
    status,
    percentOfMin: min ? (actual / min) * 100 : 100,
  };
}

export function checkAafcoCompliance(
  per1000Kcal: NutrientValues,
  ls: AafcoLifeStage
): NutrientComplianceStatus[] {
  return AAFCO_STANDARDS.map((std) => checkStandard(per1000Kcal, std, ls));
}

export function scoreAminoAcids(
  per1000Kcal: NutrientValues,
  ls: AafcoLifeStage
): AminoAcidResult {
  const statuses = AMINO_ACID_STANDARDS.map((std) =>
    checkStandard(per1000Kcal, std, ls)
  );

  const deficients = statuses.filter((s) => s.status === "DEFICIENT");
  const limitingAmino =
    deficients.length > 0
      ? deficients.reduce((worst, s) =>
          s.percentOfMin < worst.percentOfMin ? s : worst
        ).label
      : null;

  const score =
    statuses.length > 0
      ? Math.min(
          100,
          statuses.reduce((sum, s) => sum + Math.min(s.percentOfMin, 100), 0) /
            statuses.length
        )
      : 100;

  return { score, limitingAmino, statuses };
}
