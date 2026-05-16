"use client";

import type { IngredientWithNutrients, IngredientNutrient } from "@/lib/nutrition/types";

const MACRO_IDS = new Set([1008, 1003, 1004, 1005, 1079, 1051, 1007]);
const MINERAL_IDS = new Set([1087, 1091, 1092, 1093, 1090, 1089, 1095, 1098, 1101, 1103, 1100]);
const VITAMIN_IDS = new Set([1104, 1110, 1109, 1185, 1165, 1166, 1167, 1170, 1175, 1177, 1178, 1180]);
const FATTY_ACID_IDS = new Set([1269, 1404, 1278, 1272]);
const AMINO_ACID_IDS = new Set([1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217, 1219, 1220, 1221]);

const MACRO_ORDER = [1008, 1003, 1004, 1005, 1079, 1051, 1007];
const MINERAL_ORDER = [1087, 1091, 1092, 1093, 1090, 1089, 1095, 1098, 1101, 1103, 1100];
const VITAMIN_ORDER = [1104, 1110, 1109, 1185, 1165, 1166, 1167, 1170, 1175, 1177, 1178, 1180];
const FATTY_ORDER = [1269, 1404, 1278, 1272];
const AMINO_ORDER = [1210, 1211, 1212, 1213, 1214, 1215, 1216, 1217, 1219, 1220, 1221];

interface Group {
  label: string;
  ids: number[];
  idSet: Set<number>;
}

const GROUPS: Group[] = [
  { label: "Proximate / Macros", ids: MACRO_ORDER, idSet: MACRO_IDS },
  { label: "Minerals", ids: MINERAL_ORDER, idSet: MINERAL_IDS },
  { label: "Vitamins", ids: VITAMIN_ORDER, idSet: VITAMIN_IDS },
  { label: "Fatty Acids", ids: FATTY_ORDER, idSet: FATTY_ACID_IDS },
  { label: "Amino Acids", ids: AMINO_ORDER, idSet: AMINO_ACID_IDS },
];

function formatAmount(amount: number): string {
  if (amount === 0) return "0";
  if (amount < 0.001) return amount.toExponential(2);
  if (amount < 1) return amount.toFixed(3);
  if (amount < 10) return amount.toFixed(2);
  return amount.toFixed(1);
}

function NutrientTable({ rows }: { rows: IngredientNutrient[] }) {
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((n) => (
          <tr key={n.id} className="border-b border-gray-100 last:border-0">
            <td className="py-1 pr-4 text-gray-600">{n.nutrientName}</td>
            <td className="py-1 text-right font-mono text-gray-900 whitespace-nowrap">
              {formatAmount(n.amount)} <span className="text-gray-400">{n.unitName}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface Props {
  ingredient: IngredientWithNutrients;
  onClose: () => void;
}

export default function IngredientNutritionModal({ ingredient, onClose }: Props) {
  const byId = new Map(ingredient.nutrients.map((n) => [n.nutrientId, n]));

  const others = ingredient.nutrients.filter((n) => {
    for (const g of GROUPS) {
      if (g.idSet.has(n.nutrientId)) return false;
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-snug">
              {ingredient.description}
            </p>
            {ingredient.foodCategory && (
              <p className="text-xs text-gray-400 mt-0.5">{ingredient.foodCategory}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">Values per 100 g as-fed</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {GROUPS.map((group) => {
            const rows = group.ids
              .map((id) => byId.get(id))
              .filter((n): n is IngredientNutrient => n !== undefined && n.amount > 0);
            if (rows.length === 0) return null;
            return (
              <section key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {group.label}
                </p>
                <NutrientTable rows={rows} />
              </section>
            );
          })}

          {others.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Other
              </p>
              <NutrientTable rows={others.filter((n) => n.amount > 0)} />
            </section>
          )}

          {ingredient.nutrients.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No nutrient data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
