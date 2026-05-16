"use client";

import { useState } from "react";
import NutrientGauge from "./NutrientGauge";
import MacroBar from "./MacroBar";
import type { NutritionAnalysisResult, NutrientComplianceStatus } from "@/lib/nutrition/types";

interface NutritionPanelProps {
  result: NutritionAnalysisResult;
  dogName: string;
}

type Tab = "macros" | "minerals" | "vitamins" | "fatty_acids" | "amino_acids";

const TABS: { id: Tab; label: string }[] = [
  { id: "macros",      label: "Macros"      },
  { id: "minerals",    label: "Minerals"    },
  { id: "vitamins",    label: "Vitamins"    },
  { id: "fatty_acids", label: "Fatty Acids" },
  { id: "amino_acids", label: "Amino Acids" },
];

// Map AAFCO nutrient field → tab
const FIELD_TAB: Record<string, Tab> = {
  proteinG: "macros", fatG: "macros", omega6LAG: "macros",
  calciumMg: "minerals", phosphorusMg: "minerals", potassiumMg: "minerals",
  sodiumMg: "minerals", magnesiumMg: "minerals", ironMg: "minerals",
  copperMg: "minerals", manganeseMg: "minerals", zincMg: "minerals",
  seleniumUg: "minerals", iodineUg: "minerals",
  vitaminAIU: "vitamins", vitaminDIU: "vitamins", vitaminEIU: "vitamins",
  thiaminMg: "vitamins", riboflavinMg: "vitamins", niacinMg: "vitamins",
  pantothenicAcidMg: "vitamins", vitaminB6Mg: "vitamins",
  folateUg: "vitamins", vitaminB12Ug: "vitamins", cholineMg: "vitamins",
  omega3ALAG: "fatty_acids", omega3EPAG: "fatty_acids", omega3DHAG: "fatty_acids",
  arginineG: "amino_acids", histidineG: "amino_acids", isoleucineG: "amino_acids",
  leucineG: "amino_acids", lysineG: "amino_acids", methionineG: "amino_acids",
  phenylalanineG: "amino_acids", threonineG: "amino_acids",
  tryptophanG: "amino_acids", valineG: "amino_acids",
};

const STATUS_BADGE: Record<string, string> = {
  OK:        "bg-green-100 text-green-800",
  WARNING:   "bg-amber-100 text-amber-800",
  DEFICIENT: "bg-red-100 text-red-800",
  EXCESSIVE: "bg-purple-100 text-purple-800",
};

const STATUS_TEXT: Record<string, string> = {
  OK:        "text-green-700",
  WARNING:   "text-amber-700",
  DEFICIENT: "text-red-700",
  EXCESSIVE: "text-purple-700",
};

function fmtN(n: number): string {
  if (n === 0) return "0";
  if (n >= 10000) return n.toFixed(0);
  if (n >= 1000)  return n.toFixed(0);
  if (n >= 100)   return n.toFixed(1);
  if (n >= 10)    return n.toFixed(2);
  if (n >= 1)     return n.toFixed(3);
  return n.toFixed(4);
}

function fmtDmb(asFedAmount: number, unit: string, dryMatterWeightG: number): string {
  if (dryMatterWeightG <= 0 || asFedAmount === 0) return "—";
  let grams: number;
  if (unit === "mg")      grams = asFedAmount / 1000;
  else if (unit === "µg") grams = asFedAmount / 1e6;
  else if (unit === "g")  grams = asFedAmount;
  else return "—"; // IU — not convertible to %
  const pct = (grams / dryMatterWeightG) * 100;
  if (pct >= 1)     return pct.toFixed(2) + "%";
  if (pct >= 0.01)  return pct.toFixed(3) + "%";
  return pct.toFixed(5) + "%";
}

interface NutrientTableProps {
  statuses: NutrientComplianceStatus[];
  result: NutritionAnalysisResult;
}

function NutrientTable({ statuses, result }: NutrientTableProps) {
  const { asFed, totalWeightG, daysPerBatch, der } = result;
  const dryMatterWeightG = Math.max(0, totalWeightG - asFed.moistureG);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            <th className="text-left px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">Nutrient</th>
            <th className="text-center px-2 py-2 font-semibold text-gray-700">Unit</th>
            <th className="text-right px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">
              Min
              <span className="block text-[9px] font-normal text-gray-400">/1000 kcal</span>
            </th>
            <th className="text-right px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">
              Max
              <span className="block text-[9px] font-normal text-gray-400">/1000 kcal</span>
            </th>
            <th className="text-right px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">
              Recipe
              <span className="block text-[9px] font-normal text-gray-400">/1000 kcal</span>
            </th>
            <th className="text-right px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">
              Dry Matter
              <span className="block text-[9px] font-normal text-gray-400">% of DM</span>
            </th>
            <th className="text-right px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">
              Batch Total
            </th>
            <th className="text-right px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">
              Daily Amt
            </th>
            <th className="text-right px-2 py-2 font-semibold text-gray-700 whitespace-nowrap">
              Daily Need
            </th>
            <th className="text-right px-2 py-2 font-semibold text-red-600 whitespace-nowrap">
              Add to Batch
            </th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((s, i) => {
            const asFedVal = (asFed as unknown as Record<string, number>)[s.nutrient] ?? 0;
            const dailyAmt = daysPerBatch > 0 ? asFedVal / daysPerBatch : 0;
            const dailyNeed = s.min !== undefined ? s.min * (der.der / 1000) : undefined;
            const shortage = s.status === "DEFICIENT" && s.min !== undefined
              ? (s.min - s.actual) * (result.totalKcal / 1000)
              : null;
            const rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50";

            return (
              <tr key={s.nutrient} className={`border-b border-gray-100 ${rowBg}`}>
                <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{s.label}</td>
                <td className="px-2 py-2 text-center text-gray-500">{s.unit}</td>
                <td className="px-2 py-2 text-right text-gray-600">
                  {s.min !== undefined ? fmtN(s.min) : "—"}
                </td>
                <td className="px-2 py-2 text-right text-gray-600">
                  {s.max !== undefined ? fmtN(s.max) : "—"}
                </td>
                <td className={`px-2 py-2 text-right font-semibold ${STATUS_TEXT[s.status]}`}>
                  {fmtN(s.actual)}
                </td>
                <td className="px-2 py-2 text-right text-gray-600">
                  {fmtDmb(asFedVal, s.unit, dryMatterWeightG)}
                </td>
                <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">
                  {fmtN(asFedVal)} {s.unit}
                </td>
                <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">
                  {daysPerBatch > 0 ? fmtN(dailyAmt) + " " + s.unit : "—"}
                </td>
                <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">
                  {dailyNeed !== undefined ? fmtN(dailyNeed) + " " + s.unit : "—"}
                </td>
                <td className="px-2 py-2 text-right font-semibold text-red-600 whitespace-nowrap">
                  {shortage !== null ? fmtN(shortage) + " " + s.unit : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function NutritionPanel({ result, dogName }: NutritionPanelProps) {
  const [tab, setTab] = useState<Tab>("macros");

  const { totalKcal, der, daysPerBatch, caPRatio, omega6To3Ratio, aminoAcids, aafco } = result;

  const deficientCount = aafco.filter((s) => s.status === "DEFICIENT").length;
  const excessiveCount = aafco.filter((s) => s.status === "EXCESSIVE").length;
  const warningCount   = aafco.filter((s) => s.status === "WARNING").length;

  const tabStatuses = aafco.filter((s) => FIELD_TAB[s.nutrient] === tab);

  function fmtRatio(n: number) {
    if (!isFinite(n)) return "∞";
    return n.toFixed(1) + " : 1";
  }

  const caPColor =
    caPRatio >= 1.1 && caPRatio <= 2.0 ? "text-green-700" :
    caPRatio >= 0.9 ? "text-amber-600" : "text-red-600";

  const omegaColor =
    omega6To3Ratio <= 10 ? "text-green-700" :
    omega6To3Ratio <= 20 ? "text-amber-600" : "text-red-600";

  // Determine content for current tab
  const isTableTab = tab !== "macros";
  const tableStatuses = tab === "amino_acids" ? aminoAcids.statuses : tabStatuses;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Summary bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <p className="text-xs font-medium text-gray-500 mb-2">
          Analysis for {dogName}
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4 text-sm">
          <div>
            <span className="text-gray-500 text-xs">Batch energy</span>
            <p className="font-semibold text-gray-900">{totalKcal.toFixed(0)} kcal</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">DER ({dogName})</span>
            <p className="font-semibold text-gray-900">{der.der.toFixed(0)} kcal/day</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Days / batch</span>
            <p className="font-semibold text-gray-900">
              {daysPerBatch > 0 ? daysPerBatch.toFixed(1) : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">AAFCO issues</span>
            <p className="font-semibold">
              {deficientCount > 0 && (
                <span className="text-red-600">{deficientCount} low </span>
              )}
              {excessiveCount > 0 && (
                <span className="text-purple-600">{excessiveCount} high </span>
              )}
              {warningCount > 0 && (
                <span className="text-amber-600">{warningCount} warn </span>
              )}
              {deficientCount + excessiveCount + warningCount === 0 && (
                <span className="text-green-600">All OK</span>
              )}
            </p>
          </div>
        </div>

        {/* Ratios */}
        <div className="mt-2 flex gap-4 text-xs">
          <span>
            Ca:P{" "}
            <span className={`font-semibold ${caPColor}`}>{fmtRatio(caPRatio)}</span>
            <span className="text-gray-400 ml-1">(ideal 1.2–1.5)</span>
          </span>
          <span>
            ω-6:ω-3{" "}
            <span className={`font-semibold ${omegaColor}`}>{fmtRatio(omega6To3Ratio)}</span>
            <span className="text-gray-400 ml-1">(ideal ≤10)</span>
          </span>
          <span>
            Amino acids{" "}
            <span className={`font-semibold ${aminoAcids.score >= 95 ? "text-green-700" : aminoAcids.score >= 70 ? "text-amber-600" : "text-red-600"}`}>
              {aminoAcids.score.toFixed(0)}%
            </span>
            {aminoAcids.limitingAmino && (
              <span className="text-gray-400 ml-1">(limiting: {aminoAcids.limitingAmino})</span>
            )}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => {
          const count = aafco.filter(
            (s) => FIELD_TAB[s.nutrient] === t.id && s.status !== "OK"
          ).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-700 text-[9px] font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "macros" ? (
        <div className="p-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <MacroBar
              proteinG={result.asFed.proteinG}
              fatG={result.asFed.fatG}
              carbsG={result.asFed.carbsG}
            />
          </div>
          {tabStatuses.map((s: NutrientComplianceStatus) => (
            <NutrientGauge
              key={s.nutrient}
              {...s}
              batchValue={(result.asFed as unknown as Record<string, number>)[s.nutrient] ?? 0}
            />
          ))}
        </div>
      ) : tableStatuses.length > 0 ? (
        <NutrientTable statuses={tableStatuses} result={result} />
      ) : (
        <p className="text-sm text-gray-400 py-8 text-center">
          No AAFCO standards tracked for this category.
        </p>
      )}

      {/* AAFCO legend */}
      <div className="px-4 pb-3 pt-2 flex flex-wrap gap-3 border-t border-gray-100">
        {Object.entries(STATUS_BADGE).map(([status, cls]) => (
          <span key={status} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        ))}
        <span className="text-[10px] text-gray-400 ml-auto">Recipe & Min/Max are per 1000 kcal ME</span>
      </div>
    </div>
  );
}
