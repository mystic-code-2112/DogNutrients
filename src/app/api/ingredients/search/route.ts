import { NextResponse } from "next/server";
import { searchFoods } from "@/lib/usda/client";
import { parseSearchFood } from "@/lib/usda/parser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  try {
    const result = await searchFoods(query, 20);
    const ingredients = result.foods.map(parseSearchFood);
    return NextResponse.json({ totalHits: result.totalHits, ingredients });
  } catch (error) {
    console.error("Ingredient search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
