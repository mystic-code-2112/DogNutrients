"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateRecipe } from "@/hooks/useRecipe";

export default function NewRecipePage({
  params,
}: {
  params: Promise<{ dogId: string }>;
}) {
  const router = useRouter();
  const createRecipe = useCreateRecipe();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Unwrap params — in the client component context we need to handle the Promise
  const [dogId, setDogId] = useState<string | null>(null);

  // Resolve params once on mount
  if (!dogId) {
    params.then((p) => setDogId(p.dogId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dogId || !name.trim()) return;
    setError(null);
    try {
      const recipe = await createRecipe.mutateAsync({ dogId, name: name.trim() });
      router.push(`/dogs/${dogId}/recipes/${recipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create recipe");
    }
  }

  if (!dogId) return null;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Link href={`/dogs/${dogId}`} className="text-sm text-blue-600 hover:underline">
        ← Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">New Recipe</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipe name
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken & Beef Mix"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!name.trim() || createRecipe.isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {createRecipe.isPending ? "Creating…" : "Create Recipe"}
        </button>
      </form>
    </main>
  );
}
