import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recipeItemSchema } from "@/lib/schemas/recipe";

type Ctx = { params: Promise<{ recipeId: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { recipeId } = await params;

  try {
    const body = await request.json();
    const data = recipeItemSchema.parse(body);

    const item = await prisma.recipeItem.create({
      data: { ...data, recipeId },
      include: { ingredient: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
