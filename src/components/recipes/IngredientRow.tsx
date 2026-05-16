"use client";

import { useEffect, useRef, useState } from "react";
import type { RecipeItem } from "@/lib/nutrition/types";
import { getMissingNutrients, type NutrientGroup } from "@/lib/nutrition/nutrient-id-map";
import IngredientNutritionModal from "./IngredientNutritionModal";

interface IngredientRowProps {
  item: RecipeItem;
  onWeightChange: (itemId: string, weightG: number) => void;
  onRemove: (itemId: string) => void;
  isPending?: boolean;
}

const GROUP_ORDER: NutrientGroup[] = ["Macros", "Minerals", "Vitamins", "Fatty Acids", "Amino Acids"];

function MissingNutrientsPopover({ nutrients }: { nutrients: ReturnType<typeof getMissingNutrients> }) {
  const byGroup = GROUP_ORDER.reduce<Partial<Record<NutrientGroup, string[]>>>(
    (acc, g) => {
      const names = nutrients.filter((n) => n.group === g).map((n) => n.label);
      if (names.length) acc[g] = names;
      return acc;
    },
    {}
  );

  return (
    <div className="absolute right-0 top-7 z-50 w-64 rounded-lg border border-amber-200 bg-white shadow-lg p-3">
      <p className="text-xs font-semibold text-amber-700 mb-2">
        Missing nutrient data ({nutrients.length})
      </p>
      <p className="text-xs text-gray-500 mb-2 leading-snug">
        Not reported or zero in USDA data — assumed zero in calculations.
      </p>
      <div className="space-y-2">
        {(Object.entries(byGroup) as [NutrientGroup, string[]][]).map(([group, names]) => (
          <div key={group}>
            <p className="text-xs font-medium text-gray-600">{group}</p>
            <p className="text-xs text-gray-500 leading-snug">{names.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IngredientRow({
  item,
  onWeightChange,
  onRemove,
  isPending,
}: IngredientRowProps) {
  const [draft, setDraft] = useState(String(item.weightG));
  const [showInfo, setShowInfo] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const missing = item.ingredient ? getMissingNutrients(item.ingredient.nutrients) : [];

  useEffect(() => {
    if (!showMissing) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowMissing(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMissing]);

  function commitWeight() {
    const val = parseFloat(draft);
    if (isNaN(val) || val <= 0) {
      setDraft(String(item.weightG));
      return;
    }
    if (val !== item.weightG) {
      onWeightChange(item.id, val);
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 break-words">
            {item.ingredient?.description ?? "Unknown ingredient"}
          </p>
          {item.ingredient?.foodCategory && (
            <p className="text-xs text-gray-400">{item.ingredient.foodCategory}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {/* Missing nutrients warning */}
          {missing.length > 0 && (
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setShowMissing((v) => !v)}
                className="text-amber-400 hover:text-amber-600 transition-colors"
                aria-label={`${missing.length} nutrients missing`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </button>
              {showMissing && <MissingNutrientsPopover nutrients={missing} />}
            </div>
          )}

          {/* Nutrition info */}
          {item.ingredient && (
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="text-gray-400 hover:text-blue-500 transition-colors"
              aria-label="View nutrition info"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          <input
            type="number"
            min={0.1}
            step={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitWeight}
            onKeyDown={(e) => e.key === "Enter" && commitWeight()}
            disabled={isPending}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <span className="text-xs text-gray-500">g</span>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={isPending}
          className="text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors mt-0.5 shrink-0"
          aria-label="Remove ingredient"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {showInfo && item.ingredient && (
        <IngredientNutritionModal
          ingredient={item.ingredient}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
