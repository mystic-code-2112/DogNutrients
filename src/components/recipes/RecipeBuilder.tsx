"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/stores/recipeStore";
import {
  useUpdateRecipe,
  useDeleteRecipe,
  useAddRecipeItem,
  useUpdateRecipeItem,
  useDeleteRecipeItem,
} from "@/hooks/useRecipe";
import { useNutritionAnalysis } from "@/hooks/useNutritionAnalysis";
import { useDog } from "@/hooks/useDogProfile";
import IngredientSearch from "@/components/recipes/IngredientSearch";
import IngredientRow from "@/components/recipes/IngredientRow";
import NutritionPanel from "@/components/nutrition/NutritionPanel";
import type { RecipeWithItems, DogProfile, RecipeItem } from "@/lib/nutrition/types";
import type { ParsedIngredient } from "@/lib/usda/parser";

const COOKING_LABELS: Record<string, string> = {
  RAW: "Raw",
  LIGHTLY_COOKED: "Lightly cooked",
  FULLY_COOKED: "Fully cooked",
  PRESSURE_COOKED: "Pressure cooked",
};

interface RecipeBuilderProps {
  initialRecipe: RecipeWithItems;
  dog: DogProfile;
}

export default function RecipeBuilder({ initialRecipe, dog }: RecipeBuilderProps) {
  const router = useRouter();
  const { recipe, setRecipe, addItem, updateItem, removeItem } = useRecipeStore();
  const [nameEdit, setNameEdit] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialRecipe.name);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setRecipe(initialRecipe);
  }, [initialRecipe, setRecipe]);

  const updateRecipe    = useUpdateRecipe(initialRecipe.id);
  const deleteRecipe    = useDeleteRecipe();
  const addRecipeItem   = useAddRecipeItem(initialRecipe.id);
  const updateRecipeItem = useUpdateRecipeItem(initialRecipe.id);
  const deleteRecipeItem = useDeleteRecipeItem(initialRecipe.id);

  // Use live React Query data so updates to the dog profile are reflected
  // immediately without needing a page reload. Falls back to server-passed
  // prop on first render before the query resolves.
  const { data: liveDog = dog } = useDog(dog.id);
  const analysis = useNutritionAnalysis(liveDog);
  const current = recipe ?? initialRecipe;

  async function commitName() {
    setNameEdit(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === current.name) return;
    await updateRecipe.mutateAsync({ name: trimmed });
    setRecipe({ ...current, name: trimmed });
  }

  async function handleSelect(ing: ParsedIngredient) {
    setError(null);
    try {
      // Ensure ingredient is cached in DB — returns full nutrient data
      const res = await fetch(`/api/ingredients/${ing.fdcId}`);
      const cached = await res.json();

      const item = await addRecipeItem.mutateAsync({
        ingredientId: String(ing.fdcId),
        weightG: 100,
        sortOrder: current.items.length,
      });

      addItem({
        ...item,
        createdAt: String(item.createdAt),
        updatedAt: String(item.updatedAt),
        ingredient: cached.nutrients
          ? cached
          : {
              id: String(ing.fdcId),
              fdcId: ing.fdcId,
              description: ing.description,
              dataType: ing.dataType,
              foodCategory: ing.foodCategory,
              moisturePct: null,
              cachedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              nutrients: [],
            },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add ingredient");
    }
  }

  async function handleWeightChange(itemId: string, weightG: number) {
    const updated = await updateRecipeItem.mutateAsync({ itemId, weightG });
    // Preserve the existing ingredient (with nutrients) — the API response only
    // includes ingredient without nested nutrients, which would reset the analysis.
    const existingIngredient = current.items.find((i) => i.id === itemId)?.ingredient ?? null;
    updateItem({
      ...(updated as unknown as RecipeItem),
      createdAt: String(updated.createdAt),
      updatedAt: String(updated.updatedAt),
      ingredient: existingIngredient,
    });
  }

  async function handleRemove(itemId: string) {
    await deleteRecipeItem.mutateAsync(itemId);
    removeItem(itemId);
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/reports/${initialRecipe.id}/pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "PDF generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${current.name.replace(/[^a-z0-9]/gi, "_")}_nutrition_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete recipe "${current.name}"? This cannot be undone.`)) return;
    await deleteRecipe.mutateAsync({ recipeId: current.id, dogId: dog.id });
    router.push(`/dogs/${dog.id}`);
  }

  const totalG = current.items.reduce((s, i) => s + i.weightG, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* ── Left column: recipe editor ── */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {nameEdit ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => e.key === "Enter" && commitName()}
                className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent w-full"
              />
            ) : (
              <button
                onClick={() => setNameEdit(true)}
                className="text-2xl font-bold text-gray-900 text-left hover:text-blue-600 transition-colors"
              >
                {current.name}
              </button>
            )}
            <p className="text-sm text-gray-500 mt-0.5">
              {COOKING_LABELS[current.cookingMethod]} · {totalG.toFixed(0)} g total
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading || current.items.length === 0}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-40"
            >
              {downloading ? "Generating…" : "↓ PDF"}
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Ingredient search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Add ingredient
          </label>
          <IngredientSearch onSelect={handleSelect} />
          {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>

        {/* Ingredient list */}
        {current.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Search for an ingredient above to get started.
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Ingredients ({current.items.length})
            </p>
            {current.items.map((item) => (
              <IngredientRow
                key={item.id}
                item={item}
                onWeightChange={handleWeightChange}
                onRemove={handleRemove}
                isPending={updateRecipeItem.isPending || deleteRecipeItem.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right column: nutrition panel ── */}
      <div className="sticky top-6">
        {analysis ? (
          <NutritionPanel result={analysis} dogName={liveDog.name} />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
            Add ingredients to see live nutrition analysis.
          </div>
        )}
      </div>
    </div>
  );
}
