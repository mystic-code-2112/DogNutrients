import { prisma } from "@/lib/db";
import { dogSchema } from "@/lib/schemas/dog";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    const dogs = await prisma.dog.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(dogs);
  } catch (error) {
    console.error("[GET /api/dogs]", error);
    return NextResponse.json({ error: "Failed to fetch dogs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = dogSchema.parse(body);
    const dog = await prisma.dog.create({ data });
    return NextResponse.json(dog, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("[POST /api/dogs]", error);
    return NextResponse.json({ error: "Failed to create dog" }, { status: 500 });
  }
}
