export type Sex = "MALE" | "FEMALE";

export type LifeStage =
  | "PUPPY_UNDER_4MO"
  | "PUPPY_OVER_4MO"
  | "ADULT"
  | "SENIOR"
  | "PREGNANT"
  | "LACTATING";

export type ActivityLevel =
  | "SEDENTARY"
  | "LESS_ACTIVE"
  | "MODERATE"
  | "ACTIVE"
  | "WORKING"
  | "HIGHLY_ACTIVE";

export interface DogProfile {
  id: string;
  name: string;
  breed: string | null;
  weightKg: number;
  ageMonths: number;
  sex: Sex;
  lifeStage: LifeStage;
  isNeutered: boolean;
  activityLevel: ActivityLevel;
  healthConditions: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DogFormData = Omit<DogProfile, "id" | "createdAt" | "updatedAt">;

// ─── Recipes ──────────────────────────────────────────────────────────────────

export type CookingMethod =
  | "RAW"
  | "LIGHTLY_COOKED"
  | "FULLY_COOKED"
  | "PRESSURE_COOKED";

export interface Recipe {
  id: string;
  dogId: string;
  name: string;
  description: string | null;
  batchSizeG: number;
  cookingMethod: CookingMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientNutrient {
  id: string;
  ingredientId: string;
  nutrientId: number;
  nutrientName: string;
  amount: number;
  unitName: string;
}

export interface Ingredient {
  id: string;
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory: string | null;
  moisturePct: number | null;
  cachedAt: string;
  updatedAt: string;
}

export interface IngredientWithNutrients extends Ingredient {
  nutrients: IngredientNutrient[];
}

export interface RecipeItem {
  id: string;
  recipeId: string;
  ingredientId: string | null;
  weightG: number;
  isCooked: boolean;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  ingredient: IngredientWithNutrients | null;
}

export interface RecipeWithItems extends Recipe {
  items: RecipeItem[];
}

export type RecipeFormData = Pick<
  Recipe,
  "name" | "description" | "batchSizeG" | "cookingMethod" | "notes"
>;

// ─── Nutrient Values ──────────────────────────────────────────────────────────

/** All nutrient amounts are per 100g as-fed unless noted. */
export interface NutrientValues {
  // Macros
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  moistureG: number;
  ashG: number;

  // Minerals
  calciumMg: number;
  phosphorusMg: number;
  potassiumMg: number;
  sodiumMg: number;
  magnesiumMg: number;
  ironMg: number;
  zincMg: number;
  copperMg: number;
  manganeseMg: number;
  seleniumUg: number;
  iodineUg: number;

  // Vitamins
  vitaminAIU: number;
  vitaminDIU: number;
  vitaminEIU: number;
  vitaminKUg: number;
  thiaminMg: number;
  riboflavinMg: number;
  niacinMg: number;
  pantothenicAcidMg: number;
  vitaminB6Mg: number;
  folateUg: number;
  vitaminB12Ug: number;
  cholineMg: number;

  // Fatty acids
  omega6LAG: number;
  omega3ALAG: number;
  omega3EPAG: number;
  omega3DHAG: number;

  // Amino acids
  tryptophanG: number;
  threonineG: number;
  isoleucineG: number;
  leucineG: number;
  lysineG: number;
  methionineG: number;
  cystineG: number;
  phenylalanineG: number;
  valineG: number;
  arginineG: number;
  histidineG: number;
}

export interface NutrientComplianceStatus {
  nutrient: string;
  label: string;
  actual: number;
  min: number | undefined;
  max: number | undefined;
  unit: string;
  status: "OK" | "DEFICIENT" | "EXCESSIVE" | "WARNING";
  percentOfMin: number;
}

export interface AminoAcidResult {
  score: number; // 0–100
  limitingAmino: string | null;
  statuses: NutrientComplianceStatus[];
}

export interface DERResult {
  rer: number;
  der: number;
  kFactor: number;
  method: string;
}

export interface NutritionAnalysisResult {
  totalWeightG: number;
  totalKcal: number;
  der: DERResult;
  daysPerBatch: number;
  asFed: NutrientValues;
  dmb: NutrientValues;
  per1000Kcal: NutrientValues;
  aafco: NutrientComplianceStatus[];
  caPRatio: number;
  omega6To3Ratio: number;
  aminoAcids: AminoAcidResult;
}

/** A recipe item ready for the nutrition engine. */
export interface RecipeItemForEngine {
  weightG: number;
  cookingMethod: CookingMethod;
  nutrients: NutrientValues; // per 100g as-fed
  moisturePct: number;       // 0–100
}
