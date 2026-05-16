import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { prisma } from "@/lib/db";
import { calculateRecipeNutrition } from "@/lib/nutrition/engine";
import { dbNutrientsToValues } from "@/lib/nutrition/nutrient-id-map";
import { dogLifeStageToAafco } from "@/lib/nutrition/aafco";
import { ReportDocument } from "@/lib/pdf/ReportDocument";
import type { DogProfile, RecipeWithItems, RecipeItem, RecipeItemForEngine } from "@/lib/nutrition/types";

type Ctx = { params: Promise<{ recipeId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { recipeId } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      dog: true,
      items: {
        orderBy: { sortOrder: "asc" },
        include: { ingredient: { include: { nutrients: true } } },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  if (recipe.items.length === 0) {
    return NextResponse.json({ error: "Recipe has no ingredients" }, { status: 400 });
  }

  const dog = recipe.dog;

  const dogProfile: DogProfile = {
    ...dog,
    createdAt: dog.createdAt.toISOString(),
    updatedAt: dog.updatedAt.toISOString(),
  };

  // Build engine items
  const engineItems: RecipeItemForEngine[] = recipe.items
    .filter((item) => item.ingredient !== null)
    .map((item) => {
      const nutrients = dbNutrientsToValues(item.ingredient!.nutrients);
      return {
        weightG: item.weightG,
        cookingMethod: recipe.cookingMethod as RecipeItemForEngine["cookingMethod"],
        nutrients,
        moisturePct: nutrients.moistureG,
      };
    });

  if (engineItems.length === 0) {
    return NextResponse.json({ error: "No ingredient nutrient data available" }, { status: 400 });
  }

  const result = calculateRecipeNutrition(engineItems, dogProfile);

  // Serialize recipe for the document
  const serializedRecipe: RecipeWithItems = {
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    items: recipe.items.map((item): RecipeItem => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      ingredient: item.ingredient
        ? {
            ...item.ingredient,
            cachedAt: item.ingredient.cachedAt.toISOString(),
            updatedAt: item.ingredient.updatedAt.toISOString(),
            nutrients: item.ingredient.nutrients,
          }
        : null,
    })),
  };

  const generatedAt = new Date().toLocaleDateString("en-AU", {
    year: "numeric", month: "long", day: "numeric",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(ReportDocument as any, {
    dog: dogProfile,
    recipe: serializedRecipe,
    result,
    generatedAt,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await (renderToBuffer as any)(element);

  const filename = `${recipe.name.replace(/[^a-z0-9]/gi, "_")}_nutrition_report.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
