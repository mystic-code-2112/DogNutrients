import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { NutritionAnalysisResult, NutrientComplianceStatus } from "@/lib/nutrition/types";
import type { RecipeWithItems } from "@/lib/nutrition/types";
import type { DogProfile } from "@/lib/nutrition/types";

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a1a",
    padding: 36,
    lineHeight: 1.4,
  },
  pageLandscape: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#1a1a1a",
    padding: 28,
    lineHeight: 1.3,
  },
  // Header
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#555" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e0e0e0", marginVertical: 10 },
  dividerLight: { borderBottomWidth: 1, borderBottomColor: "#e0e0e0", marginVertical: 6 },
  // Section
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, color: "#1a3a5c" },
  sectionTitleSm: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#1a3a5c" },
  // Two-column grid
  row: { flexDirection: "row", gap: 8 },
  col: { flex: 1 },
  // Profile box
  profileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  profileItem: {
    width: "30%",
    backgroundColor: "#f5f7fa",
    borderRadius: 4,
    padding: 6,
    marginBottom: 4,
  },
  profileLabel: { fontSize: 7, color: "#888", marginBottom: 1 },
  profileValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Summary cards
  summaryRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f0f4ff",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  summaryValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1a3a5c" },
  summaryLabel: { fontSize: 7, color: "#666", marginTop: 2 },
  // Macro bar
  macroBarContainer: { marginBottom: 10 },
  macroBarRow: { flexDirection: "row", height: 14, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  macroLegendRow: { flexDirection: "row", gap: 12 },
  macroLegendItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  macroLegendDot: { width: 6, height: 6, borderRadius: 3 },
  // Ingredient table
  table: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#1a3a5c", padding: 5 },
  tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#fff" },
  tableRow: { flexDirection: "row", padding: 5, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  tableRowAlt: { backgroundColor: "#fafafa" },
  tableCell: { fontSize: 8, color: "#333" },
  // Nutrient table (landscape)
  ntTable: { borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 3, overflow: "hidden", marginBottom: 10 },
  ntHeader: { flexDirection: "row", backgroundColor: "#1a3a5c", paddingVertical: 4, paddingHorizontal: 4 },
  ntHeaderCell: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#fff", textAlign: "right" },
  ntHeaderCellLeft: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#fff", textAlign: "left" },
  ntSubHeader: { flexDirection: "row", backgroundColor: "#2d5a8c", paddingVertical: 2, paddingHorizontal: 4 },
  ntSubHeaderCell: { fontSize: 5.5, color: "#cce0ff", textAlign: "right" },
  ntSubHeaderCellLeft: { fontSize: 5.5, color: "#cce0ff", textAlign: "left" },
  ntRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  ntRowAlt: { backgroundColor: "#f8f9fb" },
  ntCell: { fontSize: 6.5, color: "#444", textAlign: "right" },
  ntCellLeft: { fontSize: 6.5, color: "#222", textAlign: "left" },
  // Footer
  footer: { position: "absolute", bottom: 24, left: 36, right: 36 },
  footerLandscape: { position: "absolute", bottom: 18, left: 28, right: 28 },
  footerText: { fontSize: 7, color: "#aaa", textAlign: "center" },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  else return "—";
  const pct = (grams / dryMatterWeightG) * 100;
  if (pct >= 1)    return pct.toFixed(2) + "%";
  if (pct >= 0.01) return pct.toFixed(3) + "%";
  return pct.toFixed(5) + "%";
}

const STATUS_COLOR: Record<string, string> = {
  OK:        "#16a34a",
  WARNING:   "#d97706",
  DEFICIENT: "#dc2626",
  EXCESSIVE: "#7c3aed",
};

const STATUS_ROW_BG: Record<string, string> = {
  OK:        "#ffffff",
  WARNING:   "#fffbeb",
  DEFICIENT: "#fef2f2",
  EXCESSIVE: "#faf5ff",
};

const LIFE_STAGE_LABELS: Record<string, string> = {
  PUPPY_UNDER_4MO: "Puppy <4mo",
  PUPPY_OVER_4MO:  "Puppy 4mo+",
  ADULT:           "Adult",
  SENIOR:          "Senior",
  PREGNANT:        "Pregnant",
  LACTATING:       "Lactating",
};

const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY:    "Sedentary",
  LESS_ACTIVE:  "Less Active",
  MODERATE:     "Moderate",
  ACTIVE:       "Active",
  WORKING:      "Working",
  HIGHLY_ACTIVE: "Highly Active",
};

const COOKING_LABELS: Record<string, string> = {
  RAW:             "Raw",
  LIGHTLY_COOKED:  "Lightly Cooked",
  FULLY_COOKED:    "Fully Cooked",
  PRESSURE_COOKED: "Pressure Cooked",
};

// Fields belonging to each nutrient section
const SECTION_FIELDS: Record<string, string[]> = {
  Minerals: [
    "calciumMg","phosphorusMg","potassiumMg","sodiumMg","magnesiumMg",
    "ironMg","copperMg","manganeseMg","zincMg","seleniumUg","iodineUg",
  ],
  Vitamins: [
    "vitaminAIU","vitaminDIU","vitaminEIU","thiaminMg","riboflavinMg",
    "niacinMg","pantothenicAcidMg","vitaminB6Mg","folateUg","vitaminB12Ug","cholineMg",
  ],
  "Fatty Acids": ["omega6LAG","omega3ALAG","omega3EPAG","omega3DHAG"],
};

// ─── Nutrient Table (landscape) ───────────────────────────────────────────────

interface NutrientTablePDFProps {
  title: string;
  statuses: NutrientComplianceStatus[];
  totalKcal: number;
  asFed: Record<string, number>;
  daysPerBatch: number;
  derPerDay: number;
  dryMatterWeightG: number;
}

function NutrientTablePDF({
  title, statuses, totalKcal, asFed, daysPerBatch, derPerDay, dryMatterWeightG,
}: NutrientTablePDFProps) {
  // Column flex widths
  const C = {
    name:    2.2,
    unit:    0.45,
    min:     0.8,
    max:     0.8,
    recipe:  0.85,
    dm:      0.75,
    batch:   0.9,
    daily:   0.9,
    need:    0.9,
    add:     0.9,
  };

  return (
    <View style={S.ntTable}>
      {/* Section title row */}
      <View style={{ backgroundColor: "#0f2d50", paddingVertical: 4, paddingHorizontal: 6 }}>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>{title}</Text>
      </View>

      {/* Column headers */}
      <View style={S.ntHeader}>
        <Text style={[S.ntHeaderCellLeft, { flex: C.name }]}>Nutrient</Text>
        <Text style={[S.ntHeaderCell, { flex: C.unit }]}>Unit</Text>
        <Text style={[S.ntHeaderCell, { flex: C.min }]}>Min</Text>
        <Text style={[S.ntHeaderCell, { flex: C.max }]}>Max</Text>
        <Text style={[S.ntHeaderCell, { flex: C.recipe }]}>Recipe</Text>
        <Text style={[S.ntHeaderCell, { flex: C.dm }]}>DM%</Text>
        <Text style={[S.ntHeaderCell, { flex: C.batch }]}>Batch Total</Text>
        <Text style={[S.ntHeaderCell, { flex: C.daily }]}>Daily Amt</Text>
        <Text style={[S.ntHeaderCell, { flex: C.need }]}>Daily Need</Text>
        <Text style={[S.ntHeaderCell, { flex: C.add, color: "#ffaaaa" }]}>Add to Batch</Text>
      </View>

      {/* Sub-header */}
      <View style={S.ntSubHeader}>
        <Text style={[S.ntSubHeaderCellLeft, { flex: C.name }]}> </Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.unit }]}> </Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.min }]}>/1000 kcal</Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.max }]}>/1000 kcal</Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.recipe }]}>/1000 kcal</Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.dm }]}>% of DM</Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.batch }]}> </Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.daily }]}> </Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.need }]}>AAFCO min</Text>
        <Text style={[S.ntSubHeaderCell, { flex: C.add }]}>if deficient</Text>
      </View>

      {/* Data rows */}
      {statuses.map((s, i) => {
        const asFedVal  = asFed[s.nutrient] ?? 0;
        const dailyAmt  = daysPerBatch > 0 ? asFedVal / daysPerBatch : 0;
        const dailyNeed = s.min !== undefined ? s.min * (derPerDay / 1000) : null;
        const shortage  = s.status === "DEFICIENT" && s.min !== undefined
          ? (s.min - s.actual) * (totalKcal / 1000)
          : null;
        const rowBg = s.status !== "OK"
          ? STATUS_ROW_BG[s.status]
          : i % 2 === 0 ? "#ffffff" : "#f8f9fb";

        return (
          <View key={s.nutrient} style={[S.ntRow, { backgroundColor: rowBg }]}>
            <Text style={[S.ntCellLeft, { flex: C.name }]}>{s.label}</Text>
            <Text style={[S.ntCell, { flex: C.unit, color: "#666" }]}>{s.unit}</Text>
            <Text style={[S.ntCell, { flex: C.min, color: "#555" }]}>
              {s.min !== undefined ? fmtN(s.min) : "—"}
            </Text>
            <Text style={[S.ntCell, { flex: C.max, color: "#555" }]}>
              {s.max !== undefined ? fmtN(s.max) : "—"}
            </Text>
            <Text style={[S.ntCell, { flex: C.recipe, fontFamily: "Helvetica-Bold", color: STATUS_COLOR[s.status] }]}>
              {fmtN(s.actual)}
            </Text>
            <Text style={[S.ntCell, { flex: C.dm, color: "#555" }]}>
              {fmtDmb(asFedVal, s.unit, dryMatterWeightG)}
            </Text>
            <Text style={[S.ntCell, { flex: C.batch, color: "#444" }]}>
              {fmtN(asFedVal)} {s.unit}
            </Text>
            <Text style={[S.ntCell, { flex: C.daily, color: "#444" }]}>
              {daysPerBatch > 0 ? fmtN(dailyAmt) + " " + s.unit : "—"}
            </Text>
            <Text style={[S.ntCell, { flex: C.need, color: "#444" }]}>
              {dailyNeed !== null ? fmtN(dailyNeed) + " " + s.unit : "—"}
            </Text>
            <Text style={[S.ntCell, { flex: C.add, fontFamily: shortage !== null ? "Helvetica-Bold" : "Helvetica", color: "#dc2626" }]}>
              {shortage !== null ? fmtN(shortage) + " " + s.unit : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

interface ReportDocumentProps {
  dog: DogProfile;
  recipe: RecipeWithItems;
  result: NutritionAnalysisResult;
  generatedAt: string;
}

export function ReportDocument({ dog, recipe, result, generatedAt }: ReportDocumentProps) {
  const { totalKcal, der, daysPerBatch, asFed, totalWeightG, aafco, caPRatio, omega6To3Ratio, aminoAcids } = result;

  const proteinKcal = asFed.proteinG * 4;
  const fatKcal     = asFed.fatG     * 9;
  const carbsKcal   = asFed.carbsG   * 4;
  const macroTotal  = proteinKcal + fatKcal + carbsKcal || 1;

  const proteinPct = (proteinKcal / macroTotal) * 100;
  const fatPct     = (fatKcal     / macroTotal) * 100;
  const carbsPct   = (carbsKcal   / macroTotal) * 100;

  const deficient = aafco.filter((s) => s.status === "DEFICIENT").length;
  const excessive = aafco.filter((s) => s.status === "EXCESSIVE").length;
  const warnings  = aafco.filter((s) => s.status === "WARNING").length;

  const dryMatterWeightG = Math.max(0, totalWeightG - asFed.moistureG);
  const asFedRecord = asFed as unknown as Record<string, number>;

  // Build per-section AAFCO statuses
  const aafcoByField = Object.fromEntries(aafco.map((s) => [s.nutrient, s]));
  const sectionStatuses = (fields: string[]) =>
    fields.map((f) => aafcoByField[f]).filter(Boolean) as NutrientComplianceStatus[];

  return (
    <Document title={`${recipe.name} — Nutrition Report`} author="DogNutrients">
      {/* ── Page 1: Summary (portrait) ── */}
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>{recipe.name}</Text>
          <Text style={S.subtitle}>
            Nutrition Report for {dog.name} · Generated {generatedAt}
          </Text>
        </View>
        <View style={S.divider} />

        {/* Dog profile */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Dog Profile</Text>
          <View style={S.profileGrid}>
            {([
              ["Name",       dog.name],
              ["Breed",      dog.breed ?? "—"],
              ["Weight",     dog.weightKg + " kg"],
              ["Age",        dog.ageMonths + " months"],
              ["Sex",        dog.sex === "MALE" ? "Male" : "Female"],
              ["Life Stage", LIFE_STAGE_LABELS[dog.lifeStage] ?? dog.lifeStage],
              ["Neutered",   dog.isNeutered ? "Yes" : "No"],
              ["Activity",   ACTIVITY_LABELS[dog.activityLevel] ?? dog.activityLevel],
              ["Health",     dog.healthConditions.length > 0 ? dog.healthConditions.join(", ") : "None"],
            ] as [string, string][]).map(([label, value]) => (
              <View key={label} style={S.profileItem}>
                <Text style={S.profileLabel}>{label}</Text>
                <Text style={S.profileValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Energy summary */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Energy Summary</Text>
          <View style={S.summaryRow}>
            {([
              [totalKcal.toFixed(0) + " kcal", "Batch energy"],
              [der.rer.toFixed(0) + " kcal/d",  "RER"],
              [der.der.toFixed(0) + " kcal/d",  "DER (k=" + der.kFactor + ")"],
              [daysPerBatch > 0 ? daysPerBatch.toFixed(1) : "—", "Days / batch"],
            ] as [string, string][]).map(([value, label]) => (
              <View key={label} style={S.summaryCard}>
                <Text style={S.summaryValue}>{value}</Text>
                <Text style={S.summaryLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Macro bar */}
          <View style={S.macroBarContainer}>
            <View style={S.macroBarRow}>
              <View style={{ width: proteinPct + "%", backgroundColor: "#2d6a5a" }} />
              <View style={{ width: fatPct + "%",     backgroundColor: "#e8d5a0" }} />
              <View style={{ width: carbsPct + "%",   backgroundColor: "#c8c8c8" }} />
            </View>
            <View style={S.macroLegendRow}>
              {([
                { label: "Protein", pct: proteinPct, color: "#2d6a5a" },
                { label: "Fat",     pct: fatPct,     color: "#c8a84b" },
                { label: "Carbs",   pct: carbsPct,   color: "#888"    },
              ]).map(({ label, pct, color }) => (
                <View key={label} style={S.macroLegendItem}>
                  <View style={[S.macroLegendDot, { backgroundColor: color }]} />
                  <Text style={{ fontSize: 7, color: "#555" }}>
                    {label} {pct.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Key ratios */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Key Ratios</Text>
          <View style={S.row}>
            {([
              ["Ca : P",           caPRatio > 0 ? caPRatio.toFixed(2) + " : 1" : "—",     "Ideal 1.2–1.5"],
              ["ω-6 : ω-3",        isFinite(omega6To3Ratio) ? omega6To3Ratio.toFixed(1) + " : 1" : "—", "Ideal ≤ 10 : 1"],
              ["Amino Acid Score", aminoAcids.score.toFixed(0) + "%", aminoAcids.limitingAmino ? "Limiting: " + aminoAcids.limitingAmino : "Complete"],
            ] as [string, string, string][]).map(([label, value, note]) => (
              <View key={label} style={[S.summaryCard, { backgroundColor: "#f5f7fa" }]}>
                <Text style={[S.summaryLabel, { marginBottom: 2 }]}>{label}</Text>
                <Text style={[S.summaryValue, { fontSize: 11 }]}>{value}</Text>
                <Text style={[S.summaryLabel, { marginTop: 2 }]}>{note}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ingredient list */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>
            {"Ingredients · " + COOKING_LABELS[recipe.cookingMethod] + " · " + recipe.items.reduce((s, i) => s + i.weightG, 0).toFixed(0) + " g total"}
          </Text>
          <View style={S.table}>
            <View style={S.tableHeader}>
              <Text style={[S.tableHeaderCell, { flex: 3 }]}>Ingredient</Text>
              <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Weight</Text>
              <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>% of batch</Text>
            </View>
            {recipe.items.map((item, i) => {
              const totalWeight = recipe.items.reduce((s, x) => s + x.weightG, 0);
              return (
                <View key={item.id} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
                  <Text style={[S.tableCell, { flex: 3 }]}>
                    {item.ingredient?.description ?? "Unknown"}
                  </Text>
                  <Text style={[S.tableCell, { flex: 1, textAlign: "right" }]}>
                    {item.weightG.toFixed(0)} g
                  </Text>
                  <Text style={[S.tableCell, { flex: 1, textAlign: "right" }]}>
                    {totalWeight > 0 ? ((item.weightG / totalWeight) * 100).toFixed(1) : "—"}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* AAFCO compliance summary */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>AAFCO Compliance Summary</Text>
          <View style={S.row}>
            {([
              [String(deficient), "Deficient", "#dc2626"],
              [String(excessive), "Excessive", "#7c3aed"],
              [String(warnings),  "Warning",   "#d97706"],
              [String(aafco.length - deficient - excessive - warnings), "OK", "#16a34a"],
            ] as [string, string, string][]).map(([count, label, color]) => (
              <View key={label} style={[S.summaryCard, { backgroundColor: "#f9f9f9" }]}>
                <Text style={[S.summaryValue, { fontSize: 16, color }]}>{count}</Text>
                <Text style={S.summaryLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={S.footer}>
          <Text style={S.footerText}>
            DogNutrients · AAFCO 2022 standards · Values are estimates; consult a veterinary nutritionist for medical diets.
          </Text>
        </View>
      </Page>

      {/* ── Page 2: Nutrient detail tables (landscape) ── */}
      <Page size="A4" orientation="landscape" style={S.pageLandscape}>
        <Text style={[S.title, { fontSize: 12, marginBottom: 2 }]}>
          {"Nutrient Detail — " + recipe.name}
        </Text>
        <Text style={{ fontSize: 7.5, color: "#666", marginBottom: 6 }}>
          {"For " + dog.name + " · " + der.der.toFixed(0) + " kcal/day DER · " + totalKcal.toFixed(0) + " kcal batch · " + (daysPerBatch > 0 ? daysPerBatch.toFixed(1) : "—") + " days/batch"}
        </Text>
        <View style={S.dividerLight} />

        <NutrientTablePDF
          title="Minerals"
          statuses={sectionStatuses(SECTION_FIELDS["Minerals"])}
          totalKcal={totalKcal}
          asFed={asFedRecord}
          daysPerBatch={daysPerBatch}
          derPerDay={der.der}
          dryMatterWeightG={dryMatterWeightG}
        />

        <NutrientTablePDF
          title="Vitamins"
          statuses={sectionStatuses(SECTION_FIELDS["Vitamins"])}
          totalKcal={totalKcal}
          asFed={asFedRecord}
          daysPerBatch={daysPerBatch}
          derPerDay={der.der}
          dryMatterWeightG={dryMatterWeightG}
        />

        <View style={S.footer}>
          <Text style={S.footerText}>
            DogNutrients · All nutrient values are estimates based on USDA FoodData Central data.
          </Text>
        </View>
      </Page>

      {/* ── Page 3: Fatty Acids & Amino Acids (landscape) ── */}
      <Page size="A4" orientation="landscape" style={S.pageLandscape}>
        <Text style={[S.title, { fontSize: 12, marginBottom: 2 }]}>
          {"Nutrient Detail (cont.) — " + recipe.name}
        </Text>
        <View style={[S.dividerLight, { marginBottom: 8 }]} />

        <NutrientTablePDF
          title="Fatty Acids"
          statuses={sectionStatuses(SECTION_FIELDS["Fatty Acids"])}
          totalKcal={totalKcal}
          asFed={asFedRecord}
          daysPerBatch={daysPerBatch}
          derPerDay={der.der}
          dryMatterWeightG={dryMatterWeightG}
        />

        <NutrientTablePDF
          title="Amino Acids"
          statuses={aminoAcids.statuses}
          totalKcal={totalKcal}
          asFed={asFedRecord}
          daysPerBatch={daysPerBatch}
          derPerDay={der.der}
          dryMatterWeightG={dryMatterWeightG}
        />

        <View style={S.footer}>
          <Text style={S.footerText}>
            DogNutrients · All nutrient values are estimates based on USDA FoodData Central data.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
