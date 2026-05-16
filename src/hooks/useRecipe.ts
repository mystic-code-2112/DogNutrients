"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Recipe,
  RecipeWithItems,
  RecipeItem,
  RecipeFormData,
} from "@/lib/nutrition/types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      typeof body.error === "string"
        ? body.error
        : JSON.stringify(body.error) ?? "Request failed";
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Recipe CRUD ─────────────────────────────────────────────────────────────

export function useRecipe(recipeId: string) {
  return useQuery<RecipeWithItems>({
    queryKey: ["recipes", recipeId],
    queryFn: () => apiFetch(`/api/recipes/${recipeId}`),
    enabled: !!recipeId,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation<Recipe, Error, { dogId: string; name: string }>({
    mutationFn: (data) =>
      apiFetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (recipe) => {
      qc.invalidateQueries({ queryKey: ["dogs", recipe.dogId] });
    },
  });
}

export function useUpdateRecipe(recipeId: string) {
  const qc = useQueryClient();
  return useMutation<Recipe, Error, Partial<RecipeFormData>>({
    mutationFn: (data) =>
      apiFetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["recipes", recipeId], (old: RecipeWithItems) => ({
        ...old,
        ...updated,
      }));
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation<void, Error, { recipeId: string; dogId: string }>({
    mutationFn: ({ recipeId }) =>
      apiFetch(`/api/recipes/${recipeId}`, { method: "DELETE" }),
    onSuccess: (_, { dogId }) => {
      qc.invalidateQueries({ queryKey: ["dogs", dogId] });
    },
  });
}

// ─── Recipe Items ─────────────────────────────────────────────────────────────

interface AddItemInput {
  ingredientId: string;
  weightG: number;
  isCooked?: boolean;
  sortOrder?: number;
}

export function useAddRecipeItem(recipeId: string) {
  const qc = useQueryClient();
  return useMutation<RecipeItem, Error, AddItemInput>({
    mutationFn: (data) =>
      apiFetch(`/api/recipes/${recipeId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes", recipeId] });
    },
  });
}

export function useUpdateRecipeItem(recipeId: string) {
  const qc = useQueryClient();
  return useMutation<RecipeItem, Error, { itemId: string; weightG?: number; isCooked?: boolean }>({
    mutationFn: ({ itemId, ...data }) =>
      apiFetch(`/api/recipes/${recipeId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes", recipeId] });
    },
  });
}

export function useDeleteRecipeItem(recipeId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (itemId) =>
      apiFetch(`/api/recipes/${recipeId}/items/${itemId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes", recipeId] });
    },
  });
}
