import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recipeUpdateSchema } from "@/lib/schemas/recipe";

type Ctx = { params: Promise<{ recipeId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { recipeId } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { ingredient: true },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json(recipe);
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { recipeId } = await params;

  try {
    const body = await request.json();
    const data = recipeUpdateSchema.parse(body);
    const recipe = await prisma.recipe.update({ where: { id: recipeId }, data });
    return NextResponse.json(recipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { recipeId } = await params;

  try {
    await prisma.recipe.delete({ where: { id: recipeId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
}
