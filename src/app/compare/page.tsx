import IngredientCompare from "@/components/compare/IngredientCompare";

export const metadata = {
  title: "Compare Ingredients — Dog Nutrient Calculator",
};

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Compare Ingredients</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add up to 5 ingredients to see their full nutritional profiles side by side (per 100 g as-fed).
        </p>
      </div>
      <IngredientCompare />
    </main>
  );
}
