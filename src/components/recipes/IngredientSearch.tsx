"use client";

import { useState, useRef } from "react";
import { useIngredientSearch } from "@/hooks/useIngredientSearch";
import type { ParsedIngredient } from "@/lib/usda/parser";

interface IngredientSearchProps {
  onSelect: (ingredient: ParsedIngredient) => void;
}

export default function IngredientSearch({ onSelect }: IngredientSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching, isError } = useIngredientSearch(query);

  function handleSelect(ingredient: ParsedIngredient) {
    onSelect(ingredient);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search ingredients (e.g. chicken breast, beef liver…)"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
          {isFetching && (
            <p className="px-3 py-2 text-sm text-gray-500">Searching…</p>
          )}

          {isError && (
            <p className="px-3 py-2 text-sm text-red-600">Search failed.</p>
          )}

          {!isFetching && !isError && data?.ingredients.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-500">No results.</p>
          )}

          {!isFetching &&
            data?.ingredients.map((ing) => (
              <button
                key={ing.fdcId}
                type="button"
                onMouseDown={() => handleSelect(ing)}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 focus:bg-blue-50 outline-none"
              >
                <span className="font-medium">{ing.description}</span>
                {ing.foodCategory && (
                  <span className="ml-2 text-xs text-gray-400">
                    {ing.foodCategory}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
