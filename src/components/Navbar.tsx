"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dogs", label: "Dogs" },
  { href: "/compare", label: "Compare Ingredients" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/dogs" className="text-sm font-semibold text-gray-900 mr-2">
          🐾 DogNutrients
        </Link>
        {links.map(({ href, label }) => {
          const active = pathname === href || (href !== "/dogs" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                active
                  ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
