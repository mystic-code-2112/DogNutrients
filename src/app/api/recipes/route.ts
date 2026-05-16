import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recipeSchema } from "@/lib/schemas/recipe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = recipeSchema.parse(body);
    const recipe = await prisma.recipe.create({ data });
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
