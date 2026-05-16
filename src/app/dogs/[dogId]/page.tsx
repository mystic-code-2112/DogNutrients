import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DogForm from "@/components/dogs/DogForm";
import type { DogProfile } from "@/lib/nutrition/types";

export const dynamic = "force-dynamic";

const COOKING_LABELS: Record<string, string> = {
  RAW: "Raw",
  LIGHTLY_COOKED: "Lightly cooked",
  FULLY_COOKED: "Fully cooked",
  PRESSURE_COOKED: "Pressure cooked",
};

export default async function DogPage({ params }: { params: Promise<{ dogId: string }> }) {
  const { dogId } = await params;

  const dog = await prisma.dog.findUnique({
    where: { id: dogId },
    include: { recipes: { orderBy: { createdAt: "desc" } } },
  });
  if (!dog) notFound();

  const dogProfile: DogProfile = {
    ...dog,
    createdAt: dog.createdAt.toISOString(),
    updatedAt: dog.updatedAt.toISOString(),
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-10">
      <div>
        <Link href="/dogs" className="text-sm text-blue-600 hover:underline">
          ← Back to Dogs
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{dog.name}</h1>
      </div>

      <DogForm dog={dogProfile} />

      {/* Recipes section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recipes</h2>
          <Link
            href={`/dogs/${dogId}/recipes/new`}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Recipe
          </Link>
        </div>

        {dog.recipes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No recipes yet.{" "}
            <Link
              href={`/dogs/${dogId}/recipes/new`}
              className="text-blue-600 hover:underline"
            >
              Create one
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {dog.recipes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dogs/${dogId}/recipes/${r.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">
                      {COOKING_LABELS[r.cookingMethod]} · {r.batchSizeG} g batch
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
