import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const LIFE_STAGE_LABELS: Record<string, string> = {
  PUPPY_UNDER_4MO: "Puppy (<4mo)",
  PUPPY_OVER_4MO: "Puppy (4mo+)",
  ADULT: "Adult",
  SENIOR: "Senior",
  PREGNANT: "Pregnant",
  LACTATING: "Lactating",
};

export default async function DogsPage() {
  const dogs = await prisma.dog.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dog Profiles</h1>
        <Link
          href="/dogs/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Dog
        </Link>
      </div>

      {dogs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-sm">No dogs yet.</p>
          <Link
            href="/dogs/new"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            Add your first dog
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {dogs.map((dog) => (
            <li key={dog.id}>
              <Link
                href={`/dogs/${dog.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-semibold text-gray-900">{dog.name}</p>
                  <p className="text-sm text-gray-500">
                    {dog.breed ? `${dog.breed} · ` : ""}
                    {LIFE_STAGE_LABELS[dog.lifeStage] ?? dog.lifeStage} ·{" "}
                    {dog.weightKg} kg · {dog.ageMonths} mo
                  </p>
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
