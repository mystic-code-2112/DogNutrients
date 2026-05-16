"use client";

import { useState } from "react";
import IngredientSearch from "@/components/recipes/IngredientSearch";
import type { IngredientWithNutrients } from "@/lib/nutrition/types";
import type { ParsedIngredient } from "@/lib/usda/parser";

const MAX_INGREDIENTS = 5;

// Nutrient groups with ordered IDs for display
const GROUPS = [
  {
    label: "Proximate / Macros",
    ids: [1008, 1003, 1004, 1005, 1079, 1051, 1007],
  },
  {
    label: "Minerals",
    ids: [1087, 1091, 1092, 1093, 1090, 1089, 1095, 1098, 1101, 1103, 1100],
  },
  {
    label: "Vitamins",
    ids: [1104, 1110, 1109, 1185, 1165, 1166, 1167, 1170, 1175, 1177, 1178, 1180],
  },
  {
    label: "Fatty Acids",
    ids: [1269, 1404, 1278, 1272],
  },
  {
    label: "Amino Acids",
    ids: [1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217, 1219, 1220, 1221],
  },
] as const;

function formatAmount(amount: number): string {
  if (amount === 0) return "—";
  if (amount < 0.001) return amount.toExponential(1);
  if (amount < 1) return amount.toFixed(3);
  if (amount < 10) return amount.toFixed(2);
  return amount.toFixed(1);
}

// Column colours for each ingredient slot
const COL_COLORS = [
  "bg-blue-50 border-blue-200",
  "bg-violet-50 border-violet-200",
  "bg-emerald-50 border-emerald-200",
  "bg-amber-50 border-amber-200",
  "bg-rose-50 border-rose-200",
];
const HEADER_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-violet-100 text-violet-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
];

export default function IngredientCompare() {
  const [ingredients, setIngredients] = useState<IngredientWithNutrients[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(ing: ParsedIngredient) {
    if (ingredients.length >= MAX_INGREDIENTS) return;
    if (ingredients.some((i) => i.fdcId === ing.fdcId)) {
      setError("This ingredient is already in the comparison.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/ingredients/${ing.fdcId}`);
      if (!res.ok) throw new Error("Failed to fetch ingredient data");
      const data: IngredientWithNutrients = await res.json();
      setIngredients((prev) => [...prev, data]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ingredient");
    } finally {
      setLoading(false);
    }
  }

  function handleRemove(fdcId: number) {
    setIngredients((prev) => prev.filter((i) => i.fdcId !== fdcId));
  }

  // Build a lookup: fdcId → (nutrientId → {amount, unit, name})
  type NutrientMap = Map<number, { amount: number; unit: string; name: string }>;
  const maps: NutrientMap[] = ingredients.map((ing) => {
    const m: NutrientMap = new Map();
    for (const n of ing.nutrients) {
      m.set(n.nutrientId, { amount: n.amount, unit: n.unitName, name: n.nutrientName });
    }
    return m;
  });

  // Collect all nutrient IDs that are in a defined group
  const knownGroupIds = new Set(GROUPS.flatMap((g) => [...g.ids]));

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <IngredientSearch onSelect={handleSelect} />
          {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        </div>
        <div className="text-sm text-gray-400 whitespace-nowrap pt-2">
          {ingredients.length}/{MAX_INGREDIENTS} added
        </div>
      </div>

      {/* Selected ingredients chips */}
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ing, idx) => (
            <div
              key={ing.fdcId}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${COL_COLORS[idx]}`}
            >
              <span className="max-w-[200px] truncate">{ing.description}</span>
              <button
                onClick={() => handleRemove(ing.fdcId)}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${ing.description}`}
              >
                ×
              </button>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-400">
              Loading…
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {ingredients.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-sm">
            Search and add up to {MAX_INGREDIENTS} ingredients to compare their nutrition side by side.
          </p>
        </div>
      )}

      {/* Comparison table */}
      {ingredients.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[180px]">
                  Nutrient (per 100 g)
                </th>
                {ingredients.map((ing, idx) => (
                  <th
                    key={ing.fdcId}
                    className={`border-b border-gray-200 px-4 py-3 text-left min-w-[140px] ${HEADER_COLORS[idx]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold leading-snug break-words">
                        {ing.description}
                      </span>
                      <button
                        onClick={() => handleRemove(ing.fdcId)}
                        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-base leading-none"
                        aria-label={`Remove ${ing.description}`}
                      >
                        ×
                      </button>
                    </div>
                    {ing.foodCategory && (
                      <p className="text-xs font-normal opacity-60 mt-0.5">{ing.foodCategory}</p>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {GROUPS.map((group) => {
                // Only show rows where at least one ingredient has data for this nutrient
                const visibleRows = group.ids.filter((nid) =>
                  maps.some((m) => (m.get(nid)?.amount ?? 0) > 0)
                );
                if (visibleRows.length === 0) return null;

                return (
                  <>
                    {/* Group header row */}
                    <tr key={`group-${group.label}`}>
                      <td
                        colSpan={ingredients.length + 1}
                        className="sticky left-0 bg-gray-50 border-t border-b border-gray-200 px-4 py-1.5"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {group.label}
                        </span>
                      </td>
                    </tr>

                    {visibleRows.map((nid) => {
                      // Get nutrient name from whichever ingredient has it
                      const name =
                        maps.find((m) => m.has(nid))?.get(nid)?.name ?? `Nutrient ${nid}`;
                      const unit =
                        maps.find((m) => m.has(nid))?.get(nid)?.unit ?? "";

                      // Find max value for relative bar
                      const amounts = maps.map((m) => m.get(nid)?.amount ?? 0);
                      const maxVal = Math.max(...amounts);

                      return (
                        <tr key={nid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                          <td className="sticky left-0 bg-white border-r border-gray-100 px-4 py-2 text-gray-600 text-xs">
                            {name}
                            <span className="ml-1 text-gray-400">{unit}</span>
                          </td>
                          {maps.map((m, idx) => {
                            const amount = m.get(nid)?.amount ?? 0;
                            const barPct = maxVal > 0 ? (amount / maxVal) * 100 : 0;
                            return (
                              <td
                                key={ingredients[idx].fdcId}
                                className="px-4 py-2 text-right font-mono text-xs text-gray-900"
                              >
                                <div className="flex items-center gap-2 justify-end">
                                  {/* Relative bar */}
                                  <div className="flex-1 max-w-[60px] h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${["bg-blue-400","bg-violet-400","bg-emerald-400","bg-amber-400","bg-rose-400"][idx]}`}
                                      style={{ width: `${barPct}%` }}
                                    />
                                  </div>
                                  <span>{formatAmount(amount)}</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
