import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import RecipeBuilder from "@/components/recipes/RecipeBuilder";
import type { RecipeWithItems, RecipeItem, DogProfile } from "@/lib/nutrition/types";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ dogId: string; recipeId: string }>;
}) {
  const { dogId, recipeId } = await params;

  const [recipe, dog] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: { ingredient: { include: { nutrients: true } } },
        },
      },
    }),
    prisma.dog.findUnique({ where: { id: dogId } }),
  ]);

  if (!recipe || recipe.dogId !== dogId || !dog) notFound();

  const dogProfile: DogProfile = {
    ...dog,
    createdAt: dog.createdAt.toISOString(),
    updatedAt: dog.updatedAt.toISOString(),
  };

  const serialized: RecipeWithItems = {
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href={`/dogs/${dogId}`} className="text-sm text-blue-600 hover:underline">
        ← Back to {dog.name}
      </Link>
      <div className="mt-4">
        <RecipeBuilder initialRecipe={serialized} dog={dogProfile} />
      </div>
    </main>
  );
}
