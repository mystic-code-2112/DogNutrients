"use client";

interface NutrientGaugeProps {
  label: string;
  /** Per-1000-kcal value — used only for AAFCO compliance bar */
  actual: number;
  /** Actual amount in the batch (as-fed) — shown as the primary number */
  batchValue: number;
  min: number | undefined;
  max: number | undefined;
  unit: string;
  status: "OK" | "DEFICIENT" | "EXCESSIVE" | "WARNING";
  percentOfMin: number;
}

const STATUS_COLOR = {
  OK:        { bar: "#22c55e", text: "text-green-700", bg: "bg-green-50" },
  WARNING:   { bar: "#f59e0b", text: "text-amber-700", bg: "bg-amber-50" },
  DEFICIENT: { bar: "#ef4444", text: "text-red-700",   bg: "bg-red-50"   },
  EXCESSIVE: { bar: "#8b5cf6", text: "text-purple-700", bg: "bg-purple-50" },
};

function fmt(n: number) {
  if (n >= 1000) return n.toFixed(0);
  if (n >= 10)   return n.toFixed(1);
  return n.toFixed(2);
}

export default function NutrientGauge({
  label,
  batchValue,
  min,
  unit,
  status,
  percentOfMin,
}: NutrientGaugeProps) {
  const colors = STATUS_COLOR[status];
  const pct = Math.min(percentOfMin, 150);
  const barWidth = `${(pct / 150) * 100}%`;

  return (
    <div className={`rounded-lg px-3 py-2.5 ${colors.bg}`}>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-gray-700 truncate mr-2">{label}</span>
        <span className={`text-xs font-semibold shrink-0 ${colors.text}`}>
          {fmt(batchValue)} {unit}
        </span>
      </div>

      {/* Compliance bar — based on per-1000-kcal vs AAFCO min */}
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: barWidth, backgroundColor: colors.bar }}
        />
      </div>

      {min !== undefined && (
        <p className="mt-0.5 text-[10px] text-gray-400">
          {percentOfMin.toFixed(0)}% of AAFCO min
        </p>
      )}
    </div>
  );
}
