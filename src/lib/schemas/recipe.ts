import { z } from "zod";

export const recipeSchema = z.object({
  dogId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullish(),
  batchSizeG: z.number().positive().default(1000),
  cookingMethod: z
    .enum(["RAW", "LIGHTLY_COOKED", "FULLY_COOKED", "PRESSURE_COOKED"])
    .default("RAW"),
  notes: z.string().nullish(),
});

export const recipeUpdateSchema = recipeSchema.omit({ dogId: true }).partial();

export const recipeItemSchema = z.object({
  ingredientId: z.string().min(1),
  weightG: z.number().positive("Weight must be positive"),
  isCooked: z.boolean().default(false),
  notes: z.string().nullish(),
  sortOrder: z.number().int().default(0),
});

export const recipeItemUpdateSchema = z.object({
  weightG: z.number().positive().optional(),
  isCooked: z.boolean().optional(),
  notes: z.string().nullish(),
  sortOrder: z.number().int().optional(),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
export type RecipeUpdateInput = z.infer<typeof recipeUpdateSchema>;
export type RecipeItemInput = z.infer<typeof recipeItemSchema>;
export type RecipeItemUpdateInput = z.infer<typeof recipeItemUpdateSchema>;
