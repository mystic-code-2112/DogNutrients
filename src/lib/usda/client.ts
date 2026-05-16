/**
 * Thin wrapper around the USDA FoodData Central API.
 * https://api.nal.usda.gov/fdc/v1/
 */

const BASE = "https://api.nal.usda.gov/fdc/v1";

function apiKey() {
  const key = process.env.USDA_API_KEY;
  if (!key) throw new Error("USDA_API_KEY is not set");
  return key;
}

// ─── Types returned by the FDC API ───────────────────────────────────────────

export interface FdcSearchFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    unitName: string;
    value: number;
  }>;
  score?: number;
}

export interface FdcSearchResult {
  totalHits: number;
  foods: FdcSearchFood[];
}

export interface FdcFoodDetail {
  fdcId: number;
  description: string;
  dataType: string;
  foodCategory?: string | { description: string };
  foodNutrients: Array<{
    nutrient: {
      id: number;
      name: string;
      unitName: string;
    };
    amount: number;
  }>;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function searchFoods(
  query: string,
  pageSize = 20
): Promise<FdcSearchResult> {
  const params = new URLSearchParams({
    query,
    api_key: apiKey(),
    pageSize: String(pageSize),
    dataType: "Foundation,SR Legacy",
  });

  const res = await fetch(`${BASE}/foods/search?${params}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`FDC search failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<FdcSearchResult>;
}

export async function getFoodDetail(fdcId: number): Promise<FdcFoodDetail> {
  const params = new URLSearchParams({ api_key: apiKey() });

  const res = await fetch(`${BASE}/food/${fdcId}?${params}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`FDC food detail failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<FdcFoodDetail>;
}
