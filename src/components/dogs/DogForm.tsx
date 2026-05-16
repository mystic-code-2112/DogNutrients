"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DogProfile, DogFormData, Sex, LifeStage, ActivityLevel } from "@/lib/nutrition/types";
import { useCreateDog, useUpdateDog, useDeleteDog } from "@/hooks/useDogProfile";

interface DogFormProps {
  dog?: DogProfile;
}

const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  PUPPY_UNDER_4MO: "Puppy (under 4 months)",
  PUPPY_OVER_4MO: "Puppy (4+ months)",
  ADULT: "Adult",
  SENIOR: "Senior",
  PREGNANT: "Pregnant",
  LACTATING: "Lactating",
};

const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Sedentary",
  LESS_ACTIVE: "Less Active",
  MODERATE: "Moderate",
  ACTIVE: "Active",
  WORKING: "Working",
  HIGHLY_ACTIVE: "Highly Active",
};

export default function DogForm({ dog }: DogFormProps) {
  const router = useRouter();
  const isEdit = !!dog;

  const [fields, setFields] = useState({
    name: dog?.name ?? "",
    breed: dog?.breed ?? "",
    weightKg: dog?.weightKg?.toString() ?? "",
    ageMonths: dog?.ageMonths?.toString() ?? "",
    sex: (dog?.sex ?? "MALE") as Sex,
    lifeStage: (dog?.lifeStage ?? "ADULT") as LifeStage,
    isNeutered: dog?.isNeutered ?? false,
    activityLevel: (dog?.activityLevel ?? "MODERATE") as ActivityLevel,
    healthConditions: dog?.healthConditions?.join(", ") ?? "",
    notes: dog?.notes ?? "",
  });

  const createDog = useCreateDog();
  const updateDog = useUpdateDog(dog?.id ?? "");
  const deleteDog = useDeleteDog();

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFields((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  function setCheck(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((prev) => ({ ...prev, [field]: e.target.checked }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: DogFormData = {
      name: fields.name,
      breed: fields.breed || null,
      weightKg: parseFloat(fields.weightKg),
      ageMonths: parseInt(fields.ageMonths, 10),
      sex: fields.sex,
      lifeStage: fields.lifeStage,
      isNeutered: fields.isNeutered,
      activityLevel: fields.activityLevel,
      healthConditions: fields.healthConditions
        ? fields.healthConditions.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      notes: fields.notes || null,
    };

    if (isEdit) {
      await updateDog.mutateAsync(data);
    } else {
      await createDog.mutateAsync(data);
    }
    router.push("/dogs");
  }

  async function handleDelete() {
    if (!dog || !confirm(`Delete ${dog.name}? This cannot be undone.`)) return;
    await deleteDog.mutateAsync(dog.id);
    router.push("/dogs");
  }

  const isLoading = createDog.isPending || updateDog.isPending || deleteDog.isPending;
  const error = createDog.error?.message ?? updateDog.error?.message ?? deleteDog.error?.message;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            required
            value={fields.name}
            onChange={set("name")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <input
            type="text"
            value={fields.breed}
            onChange={set("breed")}
            placeholder="e.g. Labrador Retriever"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
          <input
            type="number"
            required
            min="0.1"
            step="0.1"
            value={fields.weightKg}
            onChange={set("weightKg")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age (months) *</label>
          <input
            type="number"
            required
            min="0"
            step="1"
            value={fields.ageMonths}
            onChange={set("ageMonths")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
          <select
            value={fields.sex}
            onChange={set("sex")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Life Stage *</label>
          <select
            value={fields.lifeStage}
            onChange={set("lifeStage")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(Object.entries(LIFE_STAGE_LABELS) as [LifeStage, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level *</label>
          <select
            value={fields.activityLevel}
            onChange={set("activityLevel")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(Object.entries(ACTIVITY_LEVEL_LABELS) as [ActivityLevel, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="isNeutered"
            type="checkbox"
            checked={fields.isNeutered}
            onChange={setCheck("isNeutered")}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label htmlFor="isNeutered" className="text-sm font-medium text-gray-700">
            Neutered / Spayed
          </label>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Health Conditions <span className="text-gray-400 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={fields.healthConditions}
            onChange={set("healthConditions")}
            placeholder="e.g. diabetes, kidney disease"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            value={fields.notes}
            onChange={set("notes")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Saving…" : isEdit ? "Update Dog" : "Add Dog"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/dogs")}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="ml-auto rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete Dog
          </button>
        )}
      </div>
    </form>
  );
}
