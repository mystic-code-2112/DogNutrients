import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recipeItemUpdateSchema } from "@/lib/schemas/recipe";

type Ctx = { params: Promise<{ recipeId: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { itemId } = await params;

  try {
    const body = await request.json();
    const data = recipeItemUpdateSchema.parse(body);
    const item = await prisma.recipeItem.update({
      where: { id: itemId },
      data,
      include: { ingredient: true },
    });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { itemId } = await params;

  try {
    await prisma.recipeItem.delete({ where: { id: itemId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
