# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build (uses custom scripts/build.cjs — do not use next build directly)
pnpm lint         # Run ESLint
pnpm test         # Run Vitest test suite
pnpm test -- --run src/__tests__/nutrition/energy.test.ts  # Run a single test file
pnpm dlx prisma migrate dev   # Run DB migrations (requires DIRECT_URL)
pnpm dlx prisma generate      # Regenerate Prisma client after schema changes
```

**Package manager**: pnpm only (enforced via `.npmrc`). Do not use npm or yarn.

## Environment Variables

Required in `.env` (no `.env.example` exists — refer to PLAN.md §10.1 and §10.4):

```
DATABASE_URL=      # Neon pooled connection (used at runtime)
DIRECT_URL=        # Neon direct connection (used by Prisma migrations only)
USDA_API_KEY=      # USDA FoodData Central API key
```

## Architecture

### Request / Data Flow

```
Page (RSC) → Prisma (server) → serialize → Client Component (props)
                                                ↓
                                         TanStack Query (mutations / refetch)
                                                ↓
                                         Zustand (recipe builder canvas state)
```

- **Server Components** fetch initial data via Prisma and pass it as props.
- **TanStack Query** handles client-side CRUD mutations with automatic cache invalidation.
- **Zustand** (`src/stores/recipeStore.ts`) holds transient recipe-builder state (ingredients, weights) — not persisted.

### Nutrition Calculation Pipeline (`src/lib/nutrition/`)

The calculation engine is pure TypeScript — no side effects, runs identically on the client (live UI updates) and the server (PDF generation).

Order of operations in `engine.ts`:
1. Scale each ingredient's nutrients by weight
2. Apply cooking corrections (moisture loss, vitamin degradation) via `CookingMethod` enum
3. Sum nutrients across all ingredients
4. Calculate metabolic energy (`energy.ts` — Standard Atwater for home-cooked)
5. Convert to dry matter basis — `dmb.ts`
6. Normalize to per-1000-kcal — `normalization.ts`
7. Evaluate AAFCO/NRC compliance — `aafco.ts`
8. Compute mineral ratios, omega balance, amino acid completeness

`useNutritionAnalysis` hook wraps this engine for real-time UI feedback.

### USDA Ingredient Caching

Ingredient data is fetched from the USDA FoodData Central API and cached in the Neon database (90-day TTL on `SearchCache`, permanent on `Ingredient` + `IngredientNutrient`). The API route at `app/api/ingredients/` acts as a write-through cache layer: DB hit → return immediately; DB miss → fetch USDA → write to DB → return.

### Database

- **ORM**: Prisma 7 with `@neondatabase/serverless` HTTP driver (not TCP) — required for serverless cold-start compatibility.
- **Prisma singleton**: `src/lib/db.ts` uses `globalThis` to prevent connection pool exhaustion in dev (hot-reload creates new module instances).
- **Migrations** require `DIRECT_URL`; runtime queries use the pooled `DATABASE_URL`.

### PDF Reports

`src/lib/pdf/ReportDocument.tsx` uses `@react-pdf/renderer` and is served from `app/api/reports/[recipeId]/pdf/route.ts`. The same nutrition engine runs server-side to produce the report data.

## Windows / exFAT Quirks

The project lives on a D: drive formatted as exFAT, which doesn't support symlinks. Four workarounds are in place:

- **`pnpm dev`** runs `scripts/dev.cjs` instead of `next dev` directly — it patches `fs.readlink` (webpack) and `fs.createWriteStream` (Next.js trace file) before spawning the dev server.
- **`pnpm build`** runs `scripts/build.cjs` instead of `next build` directly — applies the same `fs.readlink` patch for webpack compilation.
- **`next.config.ts`** disables webpack symlink resolution and webpack's filesystem cache.
- **Production builds** should target Vercel (Linux); the exFAT patches are not needed there.

Never replace `pnpm dev` with `next dev`, or `pnpm build` with `next build`, on this machine.

## Path Alias

`@/*` maps to `src/*` (configured in both `tsconfig.json` and `vitest.config.ts`).
