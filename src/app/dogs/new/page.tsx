import Link from "next/link";
import DogForm from "@/components/dogs/DogForm";

export default function NewDogPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <Link href="/dogs" className="text-sm text-blue-600 hover:underline">
          ← Back to Dogs
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add Dog</h1>
      </div>
      <DogForm />
    </main>
  );
}
