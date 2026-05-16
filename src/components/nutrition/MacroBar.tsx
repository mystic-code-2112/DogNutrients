"use client";

interface MacroBarProps {
  proteinG: number;
  fatG: number;
  carbsG: number;
}

const MACROS = [
  { key: "protein", label: "Protein", color: "#2d6a5a", kcalPer: 4 },
  { key: "fat",     label: "Fat",     color: "#e8d5a0", kcalPer: 9 },
  { key: "carbs",   label: "Carbs",   color: "#c8c8c8", kcalPer: 4 },
] as const;

export default function MacroBar({ proteinG, fatG, carbsG }: MacroBarProps) {
  const proteinKcal = proteinG * 4;
  const fatKcal     = fatG    * 9;
  const carbsKcal   = carbsG  * 4;
  const totalKcal   = proteinKcal + fatKcal + carbsKcal;

  if (totalKcal === 0) return null;

  const pct = {
    protein: (proteinKcal / totalKcal) * 100,
    fat:     (fatKcal     / totalKcal) * 100,
    carbs:   (carbsKcal   / totalKcal) * 100,
  };

  const values = { protein: proteinG, fat: fatG, carbs: carbsG };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-gray-700 mb-3">Caloric distribution</p>

      {/* Legend */}
      <div className="flex flex-col gap-1 mb-3">
        {MACROS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600">{label} calories</span>
            </div>
            <span className="font-semibold text-gray-800">
              {pct[key as keyof typeof pct].toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Stacked bar */}
      <div className="flex h-8 w-full rounded-md overflow-hidden">
        {MACROS.map(({ key, label, color }) => {
          const p = pct[key as keyof typeof pct];
          if (p < 0.5) return null;
          return (
            <div
              key={key}
              style={{ width: `${p}%`, backgroundColor: color }}
              className="flex items-center justify-center transition-all duration-300"
              title={`${label}: ${p.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Labels under bar */}
      <div className="flex mt-1" style={{ fontSize: "10px" }}>
        {MACROS.map(({ key, label, color }) => {
          const p = pct[key as keyof typeof pct];
          if (p < 0.5) return null;
          return (
            <div
              key={key}
              style={{ width: `${p}%` }}
              className="text-center text-gray-500 truncate px-0.5"
            >
              <span className="font-semibold" style={{ color }}>
                {label}
              </span>{" "}
              {p.toFixed(1)}%
            </div>
          );
        })}
      </div>
    </div>
  );
}
