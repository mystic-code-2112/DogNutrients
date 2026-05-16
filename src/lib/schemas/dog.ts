import { z } from "zod";

export const dogSchema = z.object({
  name: z.string().min(1, "Name is required"),
  breed: z.string().nullish(),
  weightKg: z.number().positive("Weight must be positive"),
  ageMonths: z.number().int().nonnegative("Age must be 0 or more"),
  sex: z.enum(["MALE", "FEMALE"]),
  lifeStage: z.enum(["PUPPY_UNDER_4MO", "PUPPY_OVER_4MO", "ADULT", "SENIOR", "PREGNANT", "LACTATING"]),
  isNeutered: z.boolean().default(false),
  activityLevel: z.enum(["SEDENTARY", "LESS_ACTIVE", "MODERATE", "ACTIVE", "WORKING", "HIGHLY_ACTIVE"]).default("MODERATE"),
  healthConditions: z.array(z.string()).default([]),
  notes: z.string().nullish(),
});

export const dogUpdateSchema = dogSchema.partial();

export type DogInput = z.infer<typeof dogSchema>;
export type DogUpdateInput = z.infer<typeof dogUpdateSchema>;
