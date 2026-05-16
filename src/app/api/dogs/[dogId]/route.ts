import { prisma } from "@/lib/db";
import { dogUpdateSchema } from "@/lib/schemas/dog";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ dogId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { dogId } = await params;
  try {
    const dog = await prisma.dog.findUnique({ where: { id: dogId } });
    if (!dog) return NextResponse.json({ error: "Dog not found" }, { status: 404 });
    return NextResponse.json(dog);
  } catch (error) {
    console.error("[GET /api/dogs/:id]", error);
    return NextResponse.json({ error: "Failed to fetch dog" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { dogId } = await params;
  try {
    const body = await request.json();
    const data = dogUpdateSchema.parse(body);
    const dog = await prisma.dog.update({ where: { id: dogId }, data });
    return NextResponse.json(dog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("[PATCH /api/dogs/:id]", error);
    return NextResponse.json({ error: "Failed to update dog" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { dogId } = await params;
  try {
    await prisma.dog.delete({ where: { id: dogId } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/dogs/:id]", error);
    return NextResponse.json({ error: "Failed to delete dog" }, { status: 500 });
  }
}
