"use client";

import { useQuery } from "@tanstack/react-query";
import type { ParsedIngredient } from "@/lib/usda/parser";

interface SearchResult {
  totalHits: number;
  ingredients: ParsedIngredient[];
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body.error === "string" ? body.error : "Request failed"
    );
  }
  return res.json();
}

export function useIngredientSearch(query: string) {
  return useQuery<SearchResult>({
    queryKey: ["ingredients", "search", query],
    queryFn: () =>
      apiFetch(`/api/ingredients/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 min — search results don't change often
  });
}

export function useIngredientDetail(fdcId: number | null) {
  return useQuery<ParsedIngredient>({
    queryKey: ["ingredients", fdcId],
    queryFn: () => apiFetch(`/api/ingredients/${fdcId}`),
    enabled: fdcId !== null,
    staleTime: 1000 * 60 * 60, // 1 hr — nutrient data is stable
  });
}
