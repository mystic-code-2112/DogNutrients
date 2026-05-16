"use client";

import { create } from "zustand";
import type { RecipeWithItems, RecipeItem } from "@/lib/nutrition/types";

interface RecipeStore {
  recipe: RecipeWithItems | null;
  setRecipe: (recipe: RecipeWithItems) => void;
  updateItem: (item: RecipeItem) => void;
  removeItem: (itemId: string) => void;
  addItem: (item: RecipeItem) => void;
  clear: () => void;
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  recipe: null,

  setRecipe: (recipe) => set({ recipe }),

  addItem: (item) =>
    set((state) => {
      if (!state.recipe) return state;
      return {
        recipe: {
          ...state.recipe,
          items: [...state.recipe.items, item],
        },
      };
    }),

  updateItem: (item) =>
    set((state) => {
      if (!state.recipe) return state;
      return {
        recipe: {
          ...state.recipe,
          items: state.recipe.items.map((i) => (i.id === item.id ? item : i)),
        },
      };
    }),

  removeItem: (itemId) =>
    set((state) => {
      if (!state.recipe) return state;
      return {
        recipe: {
          ...state.recipe,
          items: state.recipe.items.filter((i) => i.id !== itemId),
        },
      };
    }),

  clear: () => set({ recipe: null }),
}));
