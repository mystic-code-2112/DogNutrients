import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFoodDetail } from "@/lib/usda/client";
import { parseFoodDetail } from "@/lib/usda/parser";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fdcId: string }> }
) {
  const { fdcId } = await params;
  const id = Number(fdcId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid fdcId" }, { status: 400 });
  }

  try {
    // Check DB cache first (90-day TTL)
    const cached = await prisma.ingredient.findUnique({
      where: { fdcId: id },
      include: { nutrients: true },
    });

    if (cached) {
      const staleDays =
        (Date.now() - cached.cachedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (staleDays < 90) {
        return NextResponse.json(cached);
      }
    }

    // Fetch from USDA and cache
    const detail = await getFoodDetail(id);
    const parsed = parseFoodDetail(detail);

    const dataTypeMap: Record<string, string> = {
      "SR Legacy": "SR_LEGACY",
      Foundation: "FOUNDATION",
      "Survey (FNDDS)": "SURVEY_FNDDS",
      Branded: "BRANDED",
    };
    const dataType =
      (dataTypeMap[parsed.dataType] as
        | "SR_LEGACY"
        | "FOUNDATION"
        | "SURVEY_FNDDS"
        | "BRANDED") ?? "SR_LEGACY";

    const ingredient = await prisma.ingredient.upsert({
      where: { fdcId: id },
      create: {
        id: String(id),
        fdcId: id,
        description: parsed.description,
        dataType,
        foodCategory: parsed.foodCategory,
        cachedAt: new Date(),
        nutrients: {
          create: parsed.nutrients.map((n) => ({
            nutrientId: n.id,
            nutrientName: n.name,
            amount: n.valuePer100g,
            unitName: n.unit,
          })),
        },
      },
      update: {
        description: parsed.description,
        dataType,
        foodCategory: parsed.foodCategory,
        cachedAt: new Date(),
        nutrients: {
          deleteMany: {},
          create: parsed.nutrients.map((n) => ({
            nutrientId: n.id,
            nutrientName: n.name,
            amount: n.valuePer100g,
            unitName: n.unit,
          })),
        },
      },
      include: { nutrients: true },
    });

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error("Ingredient detail error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 500 });
  }
}
