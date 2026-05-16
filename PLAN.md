# Dog Nutrition Recipe Calculator — Next.js + Prisma + Neon Implementation Plan

---

## 1. Tech Stack

### Core Framework

| Layer | Technology | Justification |
|---|---|---|
| Framework | Next.js 15 (App Router) | Unified server+client, file-based routing, React Server Components reduce client bundle, built-in API routes eliminate Express |
| Language | TypeScript 5.x | End-to-end type safety from DB schema to UI; Prisma generates types automatically |
| Runtime | Node.js 20 LTS | Required by Prisma, stable for Vercel Edge Functions where needed |

### Data & Persistence

| Layer | Technology | Justification |
|---|---|---|
| ORM | Prisma 5.x | Type-safe queries, schema-first migrations, excellent Neon compatibility |
| Database | Neon (serverless PostgreSQL) | Branching for dev/staging, HTTP driver works in Vercel Edge, free tier never pauses |
| DB Driver | @neondatabase/serverless | Required for Edge Runtime compatibility; falls back to standard pg in Node.js runtime |
| Caching | Next.js fetch cache + unstable_cache | USDA responses cached at the framework level without Redis |

### UI & State

| Layer | Technology | Justification |
|---|---|---|
| Styling | Tailwind CSS 3.x | Utility-first, zero-runtime CSS, pairs perfectly with shadcn |
| Component Library | shadcn/ui | Unstyled Radix primitives + Tailwind; fully owned code, not an npm dependency |
| Client State | Zustand | Minimal boilerplate for recipe builder canvas state, ingredient selections |
| Server State | TanStack Query v5 | Stale-while-revalidate for ingredient search, dog profiles, recipe lists |

### Infrastructure

| Layer | Technology | Justification |
|---|---|---|
| Deployment | Vercel | Native Next.js support, zero-config preview deploys per branch, Neon integration via marketplace |
| PDF Export | @react-pdf/renderer | Server-rendered PDFs via Route Handler, avoids browser print quirks |
| Testing | Vitest + @testing-library/react | Faster than Jest, native ESM, same API surface |
| Package Manager | pnpm | Strict hoisting, fast installs, single-app (no workspace overhead) |

### Why No Express

Express is eliminated entirely. Next.js Route Handlers (files named `route.ts` inside `app/api/`) run in Node.js on Vercel's serverless functions. They receive `Request` objects and return `Response` objects using the Web Fetch API — the same interface as Express but with zero configuration. The USDA API key never leaves server-side code because Route Handlers do not ship to the browser bundle.

---

## 2. System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL PLATFORM                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js 15 Application                       │  │
│  │                                                           │  │
│  │  ┌─────────────────────┐  ┌──────────────────────────┐   │  │
│  │  │   React Server      │  │   Route Handlers         │   │  │
│  │  │   Components        │  │   (app/api/**/route.ts)  │   │  │
│  │  │                     │  │                          │   │  │
│  │  │  - Dog profile page │  │  /api/dogs               │   │  │
│  │  │  - Recipe list page │  │  /api/recipes            │   │  │
│  │  │  - Recipe detail    │  │  /api/ingredients/search │   │  │
│  │  │    (RSC shell)      │  │  /api/usda/[fdcId]       │   │  │
│  │  └──────────┬──────────┘  │  /api/reports/[id]/pdf   │   │  │
│  │             │             └──────────┬───────────────┘   │  │
│  │  ┌──────────▼──────────┐            │                    │  │
│  │  │  Client Components  │            │                    │  │
│  │  │  ("use client")     │            │                    │  │
│  │  │                     │            │                    │  │
│  │  │  - RecipeBuilder    │            │                    │  │
│  │  │  - NutritionPanel   │            │                    │  │
│  │  │  - IngredientSearch │            │                    │  │
│  │  │  - GaugeCharts      │            │                    │  │
│  │  └──────────┬──────────┘            │                    │  │
│  │             │                       │                    │  │
│  │  ┌──────────▼──────────┐            │                    │  │
│  │  │  Calculation Engine │            │                    │  │
│  │  │  (pure TS, shared)  │            │                    │  │
│  │  │  - lib/nutrition/*  │            │                    │  │
│  │  └─────────────────────┘            │                    │  │
│  └──────────────────────────────────── │ ───────────────────┘  │
│                                        │                        │
│            ┌───────────────────────────▼──────────────┐        │
│            │         NEON PostgreSQL                   │        │
│            │  (serverless, HTTP driver on Edge)        │        │
│            │                                           │        │
│            │  Users → Dogs → Recipes → RecipeItems     │        │
│            │  Ingredients (USDA cache) → Nutrients     │        │
│            └───────────────────────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼────────┐
                    │ USDA FoodData    │
                    │ Central API      │
                    │ (proxied through │
                    │  Route Handler)  │
                    └──────────────────┘
```

### Data Flow: Recipe Nutrition Analysis

```
User adjusts ingredient weight (client)
    │
    ▼
Zustand store updates recipe state
    │
    ▼
useNutritionAnalysis hook (TanStack Query)
    │
    ├─► If ingredient nutrients cached in store → skip fetch
    │
    └─► If not cached → GET /api/ingredients/[fdcId]
                              │
                              ▼
                        Route Handler checks DB
                              │
                    ┌─────────┴──────────┐
                    │                    │
                 DB hit              DB miss
                 return              fetch USDA API
                 cached              parse → store in DB
                 nutrients           return nutrients
                    │                    │
                    └─────────┬──────────┘
                              ▼
                    nutrients returned to hook
                              │
                              ▼
                    lib/nutrition/engine.ts
                    calculateRecipeNutrition(recipe, dog)
                              │
                              ▼
                    NutritionPanel renders
                    gauges vs AAFCO/NRC targets
```

### App Router Organization

Next.js App Router uses the filesystem as the routing layer. Server Components are the default; Client Components are explicitly marked. This distinction is critical for keeping the USDA API key and Prisma client on the server.

```
Route Segment                 Rendering       Purpose
─────────────────────────────────────────────────────────
/                             RSC             Landing page
/dogs                         RSC             Dog list (server-fetched)
/dogs/[id]                    RSC             Dog detail + recipe list
/dogs/[id]/recipes/new        RSC shell +     Recipe builder
                              Client canvas
/dogs/[id]/recipes/[recipeId] RSC shell +     Recipe editor
                              Client canvas
/reports/[recipeId]           RSC             Printable nutrition report
app/api/**                    Node.js         All API endpoints
```

---

## 3. Project Directory Structure

```
dog-nutrients/
├── app/                              # Next.js App Router root
│   ├── layout.tsx                    # Root layout (fonts, providers)
│   ├── page.tsx                      # Landing / dashboard
│   ├── globals.css                   # Tailwind base imports
│   │
│   ├── dogs/
│   │   ├── page.tsx                  # RSC: list all dogs
│   │   ├── new/
│   │   │   └── page.tsx              # RSC shell → NewDogForm (client)
│   │   └── [dogId]/
│   │       ├── page.tsx              # RSC: dog profile + recipe list
│   │       ├── edit/
│   │       │   └── page.tsx          # RSC shell → EditDogForm (client)
│   │       └── recipes/
│   │           ├── new/
│   │           │   └── page.tsx      # RSC shell → RecipeBuilder (client)
│   │           └── [recipeId]/
│   │               ├── page.tsx      # RSC shell → RecipeBuilder (client)
│   │               └── report/
│   │                   └── page.tsx  # RSC: printable nutrition report
│   │
│   ├── api/                          # All Route Handlers (server only)
│   │   ├── dogs/
│   │   │   ├── route.ts              # GET (list), POST (create)
│   │   │   └── [dogId]/
│   │   │       └── route.ts          # GET, PATCH, DELETE
│   │   │
│   │   ├── recipes/
│   │   │   ├── route.ts              # POST (create)
│   │   │   └── [recipeId]/
│   │   │       ├── route.ts          # GET, PATCH, DELETE
│   │   │       └── items/
│   │   │           ├── route.ts      # POST (add ingredient)
│   │   │           └── [itemId]/
│   │   │               └── route.ts  # PATCH (update weight), DELETE
│   │   │
│   │   ├── ingredients/
│   │   │   ├── search/
│   │   │   │   └── route.ts          # GET ?q=chicken — proxies USDA
│   │   │   └── [fdcId]/
│   │   │       └── route.ts          # GET full nutrient profile (cached)
│   │   │
│   │   ├── reports/
│   │   │   └── [recipeId]/
│   │   │       └── pdf/
│   │   │           └── route.ts      # GET → streams PDF binary
│   │   │
│   │   └── supplements/
│   │       └── route.ts              # GET static supplement library
│   │
│   └── providers.tsx                 # TanStack Query + Zustand providers
│
├── components/                       # Shared UI components
│   ├── ui/                           # shadcn/ui generated components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   ├── dogs/
│   │   ├── DogCard.tsx               # "use client" — interactive card
│   │   ├── DogForm.tsx               # "use client" — create/edit form
│   │   └── DogProfileHeader.tsx      # RSC — static profile display
│   │
│   ├── recipes/
│   │   ├── RecipeBuilder.tsx         # "use client" — main canvas
│   │   ├── IngredientSearch.tsx      # "use client" — USDA search
│   │   ├── IngredientRow.tsx         # "use client" — weight input
│   │   ├── SupplementPanel.tsx       # "use client" — supplement adder
│   │   └── RecipeCard.tsx            # RSC — recipe summary card
│   │
│   ├── nutrition/
│   │   ├── NutritionPanel.tsx        # "use client" — live analysis display
│   │   ├── NutrientGauge.tsx         # "use client" — radial progress bar
│   │   ├── MacroChart.tsx            # "use client" — pie chart
│   │   ├── AminoAcidTable.tsx        # "use client" — amino acid breakdown
│   │   ├── MineralRatioDisplay.tsx   # "use client" — Ca:P gauge
│   │   └── AafcoComplianceBadge.tsx  # RSC-compatible — static badge
│   │
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── PageHeader.tsx
│
├── lib/                              # Shared business logic (no React)
│   ├── nutrition/
│   │   ├── types.ts                  # All TS interfaces (DogProfile, Recipe, etc.)
│   │   ├── engine.ts                 # Main calculateRecipeNutrition()
│   │   ├── energy.ts                 # RER, DER, ME calculations
│   │   ├── dmb.ts                    # Dry matter basis conversions
│   │   ├── normalization.ts          # Per-1000-kcal normalization
│   │   ├── aafco.ts                  # AAFCO standards lookup tables
│   │   ├── nrc.ts                    # NRC MR/RA lookup tables
│   │   ├── amino-acids.ts            # Amino acid completeness scoring
│   │   ├── fatty-acids.ts            # Omega ratio, EPA/DHA targets
│   │   └── minerals.ts               # Ca:P ratio, mineral analysis
│   │
│   ├── usda/
│   │   ├── client.ts                 # Server-side USDA fetch wrapper
│   │   ├── nutrient-map.ts           # USDA nutrient ID → field mapping
│   │   ├── parser.ts                 # FDC response → NutrientProfile
│   │   └── priority.ts               # SR Legacy > Foundation > Survey filter
│   │
│   ├── supplements/
│   │   └── library.ts                # Static supplement definitions
│   │
│   ├── pdf/
│   │   └── ReportDocument.tsx        # @react-pdf/renderer document
│   │
│   ├── db.ts                         # Prisma client singleton
│   └── utils.ts                      # General helpers
│
├── hooks/                            # Custom React hooks (all "use client")
│   ├── useNutritionAnalysis.ts       # Reactive nutrition calculation
│   ├── useIngredientSearch.ts        # Debounced USDA search
│   ├── useDogProfile.ts              # TanStack Query: dog CRUD
│   └── useRecipe.ts                  # TanStack Query: recipe CRUD
│
├── stores/                           # Zustand stores
│   ├── recipeStore.ts                # Active recipe editor state
│   └── dogStore.ts                   # Active dog context
│
├── prisma/
│   ├── schema.prisma                 # Single source of truth for DB schema
│   └── migrations/                   # Auto-generated by prisma migrate
│
├── __tests__/                        # Vitest test files
│   ├── nutrition/
│   │   ├── energy.test.ts
│   │   ├── dmb.test.ts
│   │   └── aafco.test.ts
│   └── api/
│       └── ingredients.test.ts
│
├── public/
│   └── dog-placeholder.svg
│
├── .env.local                        # Local secrets (gitignored)
├── .env.example                      # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── prisma/schema.prisma
├── vitest.config.ts
└── package.json
```

---

## 4. Database Schema

### Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // Neon requires directUrl for migrations; pooled URL for runtime
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────────
// Users (simple auth — extend with NextAuth if needed)
// ─────────────────────────────────────────────
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  dogs      Dog[]

  @@map("users")
}

// ─────────────────────────────────────────────
// Dog Profiles
// ─────────────────────────────────────────────
model Dog {
  id        String   @id @default(cuid())
  userId    String
  name      String
  breed     String?
  weightKg  Float                         // Used for RER/DER
  ageMonths Int
  sex       Sex
  lifeStage LifeStage
  isNeutered Boolean  @default(false)
  activityLevel ActivityLevel @default(MODERATE)
  healthConditions String[]               // e.g. ["kidney_disease", "obesity"]
  photoUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipes   Recipe[]

  @@index([userId])
  @@map("dogs")
}

enum Sex {
  MALE
  FEMALE
}

enum LifeStage {
  PUPPY_UNDER_4MO
  PUPPY_OVER_4MO
  ADULT
  SENIOR
  PREGNANT
  LACTATING
}

enum ActivityLevel {
  SEDENTARY
  MODERATE
  ACTIVE
  WORKING
  HIGHLY_ACTIVE
}

// ─────────────────────────────────────────────
// Recipes
// ─────────────────────────────────────────────
model Recipe {
  id          String   @id @default(cuid())
  dogId       String
  name        String
  description String?
  batchSizeG  Float    @default(1000)     // Grams per batch
  cookingMethod CookingMethod @default(RAW)
  notes       String?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  dog         Dog          @relation(fields: [dogId], references: [id], onDelete: Cascade)
  items       RecipeItem[]

  @@index([dogId])
  @@map("recipes")
}

enum CookingMethod {
  RAW
  LIGHTLY_COOKED
  FULLY_COOKED
  PRESSURE_COOKED
}

// ─────────────────────────────────────────────
// Recipe Line Items
// ─────────────────────────────────────────────
model RecipeItem {
  id           String   @id @default(cuid())
  recipeId     String
  ingredientId String?  // null if supplement
  supplementId String?  // null if ingredient
  weightG      Float
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  recipe       Recipe      @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  ingredient   Ingredient? @relation(fields: [ingredientId], references: [id])

  @@index([recipeId])
  @@map("recipe_items")
}

// ─────────────────────────────────────────────
// Ingredient Cache (mirrors USDA FDC data)
// ─────────────────────────────────────────────
model Ingredient {
  id          String   @id                // FDC ID as string
  fdcId       Int      @unique
  description String
  dataType    FdcDataType
  foodCategory String?
  moisturePct Float?                      // Water content %, used for DMB

  nutrients   IngredientNutrient[]
  recipeItems RecipeItem[]

  cachedAt    DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([description])
  @@map("ingredients")
}

enum FdcDataType {
  SR_LEGACY
  FOUNDATION
  SURVEY_FNDDS
  BRANDED
}

// ─────────────────────────────────────────────
// Per-ingredient nutrient values (per 100g as-fed)
// ─────────────────────────────────────────────
model IngredientNutrient {
  id           String     @id @default(cuid())
  ingredientId String
  nutrientId   Int                         // USDA nutrient ID (e.g., 1003 = protein)
  nutrientName String
  amount       Float                       // Amount per 100g as-fed
  unitName     String                      // "G", "MG", "UG", "KCAL", "IU"

  ingredient   Ingredient @relation(fields: [ingredientId], references: [id], onDelete: Cascade)

  @@unique([ingredientId, nutrientId])
  @@index([ingredientId])
  @@index([nutrientId])
  @@map("ingredient_nutrients")
}

// ─────────────────────────────────────────────
// Search Cache (USDA search results)
// ─────────────────────────────────────────────
model SearchCache {
  id        String   @id @default(cuid())
  query     String   @unique
  results   Json                           // Array of FDC search hits
  createdAt DateTime @default(now())

  @@index([query])
  @@map("search_cache")
}
```

### Schema Design Notes

The `Ingredient` table functions as a write-through cache: the first time any user searches for "chicken breast," the Route Handler fetches from USDA, writes to this table, and all subsequent requests read from PostgreSQL. The `cachedAt` field enables TTL-based invalidation (recommended: 90 days, USDA data changes rarely).

The `IngredientNutrient` table stores one row per nutrient per ingredient — approximately 150 rows per ingredient. For 500 cached ingredients that is 75,000 rows, well within Neon's free tier limits.

`RecipeItem` references either `ingredientId` or `supplementId` (supplement data stays in the static `lib/supplements/library.ts` file and is not stored in the DB).

---

## 5. API Design

All handlers live in `app/api/`. They use the Web Fetch API (`Request`/`Response`), Prisma for DB access, and run in the Node.js serverless runtime on Vercel.

### Route Handler Conventions

```typescript
// Pattern used throughout
export async function GET(
  request: Request,
  { params }: { params: { dogId: string } }
): Promise<Response> {
  try {
    // ... logic
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "message" }, { status: 500 });
  }
}
```

### Complete API Surface

#### Dogs

| Method | Path | Description | Request Body | Response |
|---|---|---|---|---|
| GET | /api/dogs | List dogs for authenticated user | — | `Dog[]` |
| POST | /api/dogs | Create dog profile | `CreateDogInput` | `Dog` |
| GET | /api/dogs/[dogId] | Get single dog with recipes | — | `Dog & { recipes: Recipe[] }` |
| PATCH | /api/dogs/[dogId] | Update dog profile | `UpdateDogInput` | `Dog` |
| DELETE | /api/dogs/[dogId] | Delete dog + cascade recipes | — | `204` |

#### Recipes

| Method | Path | Description | Request Body | Response |
|---|---|---|---|---|
| POST | /api/recipes | Create empty recipe for a dog | `{ dogId, name }` | `Recipe` |
| GET | /api/recipes/[recipeId] | Get recipe with all items + nutrients | — | `RecipeWithItems` |
| PATCH | /api/recipes/[recipeId] | Update recipe metadata | `UpdateRecipeInput` | `Recipe` |
| DELETE | /api/recipes/[recipeId] | Delete recipe | — | `204` |
| POST | /api/recipes/[recipeId]/items | Add ingredient/supplement to recipe | `AddItemInput` | `RecipeItem` |
| PATCH | /api/recipes/[recipeId]/items/[itemId] | Update ingredient weight | `{ weightG: number }` | `RecipeItem` |
| DELETE | /api/recipes/[recipeId]/items/[itemId] | Remove from recipe | — | `204` |

#### Ingredients (USDA Proxy + Cache)

| Method | Path | Description | Query Params | Response |
|---|---|---|---|---|
| GET | /api/ingredients/search | Search USDA FDC (proxied, cached) | `q`, `pageSize?` | `SearchResult[]` |
| GET | /api/ingredients/[fdcId] | Get full nutrient profile (DB or USDA) | — | `IngredientWithNutrients` |

#### Reports

| Method | Path | Description | Response |
|---|---|---|---|
| GET | /api/reports/[recipeId]/pdf | Generate and stream PDF report | `application/pdf` |

#### Supplements

| Method | Path | Description | Response |
|---|---|---|---|
| GET | /api/supplements | Return static supplement library | `Supplement[]` |

### Request/Response Type Contracts

```typescript
// POST /api/dogs
interface CreateDogInput {
  name: string;
  breed?: string;
  weightKg: number;
  ageMonths: number;
  sex: "MALE" | "FEMALE";
  lifeStage: LifeStage;
  isNeutered: boolean;
  activityLevel: ActivityLevel;
  healthConditions?: string[];
}

// POST /api/recipes/[recipeId]/items
interface AddItemInput {
  fdcId?: number;         // For USDA ingredients
  supplementId?: string; // For supplements from static library
  weightG: number;
  notes?: string;
}

// GET /api/ingredients/[fdcId] — full nutrient profile
interface IngredientWithNutrients {
  fdcId: number;
  description: string;
  dataType: FdcDataType;
  moisturePct: number;
  nutrients: Record<number, { amount: number; unit: string; name: string }>;
}
```

### Caching Strategy in Route Handlers

```typescript
// app/api/ingredients/search/route.ts
import { unstable_cache } from "next/cache";

const cachedSearch = unstable_cache(
  async (query: string) => {
    // 1. Check SearchCache table
    // 2. If miss, fetch USDA API (key is server-side env var)
    // 3. Write to SearchCache
    // 4. Return results
  },
  ["usda-search"],
  { revalidate: 86400 } // 24 hours
);
```

---

## 6. Frontend Structure

### Page Components (RSC by default)

**`app/page.tsx`** — Dashboard showing recent dogs and recipes; server-renders from DB directly without an API call.

**`app/dogs/page.tsx`** — Fetches all dogs for the current user via `prisma.dog.findMany()` directly in the Server Component. No client-side fetching needed.

**`app/dogs/[dogId]/page.tsx`** — Fetches dog profile + recipe list. Passes serialized data as props to any child Client Components.

**`app/dogs/[dogId]/recipes/[recipeId]/page.tsx`** — The most complex page. The RSC shell fetches the full recipe (including all ingredient nutrients) and passes it as initial data to the `RecipeBuilder` Client Component. TanStack Query uses this as `initialData`, preventing a waterfall.

```typescript
// app/dogs/[dogId]/recipes/[recipeId]/page.tsx
import { prisma } from "@/lib/db";
import { RecipeBuilder } from "@/components/recipes/RecipeBuilder";

export default async function RecipePage({
  params,
}: {
  params: { dogId: string; recipeId: string };
}) {
  const [recipe, dog] = await Promise.all([
    prisma.recipe.findUnique({
      where: { id: params.recipeId },
      include: { items: { include: { ingredient: { include: { nutrients: true } } } } },
    }),
    prisma.dog.findUnique({ where: { id: params.dogId } }),
  ]);

  return <RecipeBuilder initialRecipe={recipe} dog={dog} />;
}
```

### Client Components

**`components/recipes/RecipeBuilder.tsx`** — The main interactive canvas. Marked `"use client"`. Reads from `useRecipeStore()` (Zustand) and renders `IngredientSearch`, a list of `IngredientRow` components, `SupplementPanel`, and `NutritionPanel` side by side.

**`components/recipes/IngredientSearch.tsx`** — Debounced search input that calls `useIngredientSearch` hook. Results displayed in a `Combobox` (shadcn). On selection, dispatches to Zustand store and calls `POST /api/recipes/[id]/items`.

**`components/nutrition/NutritionPanel.tsx`** — Subscribes to Zustand recipe state. Calls `useNutritionAnalysis` on every state change. Renders `NutrientGauge` components for each nutrient category.

### Hooks

```typescript
// hooks/useNutritionAnalysis.ts
"use client";
import { useMemo } from "react";
import { useRecipeStore } from "@/stores/recipeStore";
import { calculateRecipeNutrition } from "@/lib/nutrition/engine";
import type { DogProfile } from "@/lib/nutrition/types";

export function useNutritionAnalysis(dog: DogProfile) {
  const { items } = useRecipeStore();

  return useMemo(() => {
    if (items.length === 0) return null;
    return calculateRecipeNutrition(items, dog);
  }, [items, dog]);
}
```

```typescript
// hooks/useIngredientSearch.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/lib/utils";

export function useIngredientSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["ingredients", "search", debouncedQuery],
    queryFn: () =>
      fetch(`/api/ingredients/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then((r) => r.json()),
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 60, // 1 hour — USDA data is stable
  });
}
```

### Zustand Store

```typescript
// stores/recipeStore.ts
import { create } from "zustand";
import type { RecipeItem, IngredientWithNutrients } from "@/lib/nutrition/types";

interface RecipeState {
  recipeId: string | null;
  items: RecipeItem[];
  nutrientCache: Map<number, IngredientWithNutrients>; // fdcId → nutrients

  setRecipe: (id: string, items: RecipeItem[]) => void;
  addItem: (item: RecipeItem) => void;
  updateItemWeight: (itemId: string, weightG: number) => void;
  removeItem: (itemId: string) => void;
  cacheNutrients: (fdcId: number, data: IngredientWithNutrients) => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipeId: null,
  items: [],
  nutrientCache: new Map(),

  setRecipe: (id, items) => set({ recipeId: id, items }),

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  updateItemWeight: (itemId, weightG) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, weightG } : i
      ),
    })),

  removeItem: (itemId) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),

  cacheNutrients: (fdcId, data) =>
    set((state) => {
      const next = new Map(state.nutrientCache);
      next.set(fdcId, data);
      return { nutrientCache: next };
    }),
}));
```

---

## 7. Nutrition Calculation Engine

The engine lives entirely in `lib/nutrition/` and contains zero React imports. It runs identically on the server (for PDF generation) and on the client (for real-time UI updates). All functions are pure — same inputs always produce same outputs.

### TypeScript Types (`lib/nutrition/types.ts`)

```typescript
export interface DogProfile {
  weightKg: number;
  ageMonths: number;
  sex: "MALE" | "FEMALE";
  lifeStage: LifeStage;
  isNeutered: boolean;
  activityLevel: ActivityLevel;
  healthConditions: string[];
}

export interface NutrientValues {
  // Macros (grams per 100g as-fed)
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  moistureG: number;
  energyKcal: number;

  // Minerals (mg per 100g as-fed)
  calciumMg: number;
  phosphorusMg: number;
  potassiumMg: number;
  sodiumMg: number;
  magnesiumMg: number;
  ironMg: number;
  zincMg: number;
  copperMg: number;
  manganeseMg: number;
  seleniumUg: number;
  iodineUg: number;

  // Vitamins
  vitaminAUg: number;    // RAE
  vitaminDUg: number;
  vitaminEMg: number;
  vitaminB1Mg: number;   // Thiamine (heat-sensitive)
  vitaminB2Mg: number;
  vitaminB6Mg: number;
  vitaminB12Ug: number;
  folateMcg: number;     // Heat-sensitive
  cholineMg: number;

  // Fatty acids (g per 100g as-fed)
  omega6LA: number;
  omega3ALA: number;
  omega3EPA: number;
  omega3DHA: number;

  // Amino acids (g per 100g as-fed)
  arginine: number;
  histidine: number;
  isoleucine: number;
  leucine: number;
  lysine: number;
  methionine: number;
  phenylalanine: number;
  threonine: number;
  tryptophan: number;
  valine: number;
}

export interface RecipeItemWithNutrients {
  id: string;
  weightG: number;
  isSupplement: boolean;
  nutrients: NutrientValues;
  cookingMethod: CookingMethod;
}

export interface NutritionAnalysisResult {
  totalWeightG: number;
  totalKcal: number;
  der: DERResult;
  daysPerBatch: number;

  // Totals as-fed
  asFed: NutrientValues;

  // Dry matter basis
  dmb: NutrientValues;

  // Per 1000 kcal
  per1000Kcal: NutrientValues;

  // Compliance
  aafco: AafcoComplianceResult;
  nrc: NrcComplianceResult;

  // Ratios
  caPRatio: number;
  omega6To3Ratio: number;
  aminoAcidCompleteness: AminoAcidResult;
}
```

### Energy Calculations (`lib/nutrition/energy.ts`)

```typescript
export function calculateRER(weightKg: number): number {
  // Standard metabolic formula
  return 70 * Math.pow(weightKg, 0.75);
}

export function calculateRERSimplified(weightKg: number): number {
  // Valid only for 2–45 kg range
  if (weightKg < 2 || weightKg > 45) {
    throw new Error("Simplified RER only valid for 2–45 kg dogs");
  }
  return 30 * weightKg + 70;
}

export interface DERResult {
  rer: number;
  der: number;
  kFactor: number;
  method: string;
}

export function calculateDER(dog: DogProfile): DERResult {
  const rer = calculateRER(dog.weightKg);
  const kFactor = getKFactor(dog);
  return {
    rer,
    der: rer * kFactor,
    kFactor,
    method: `${dog.lifeStage} ${dog.isNeutered ? "neutered" : "intact"}`,
  };
}

function getKFactor(dog: DogProfile): number {
  const { lifeStage, isNeutered, activityLevel, healthConditions } = dog;

  if (healthConditions.includes("obesity") ||
      healthConditions.includes("weight_loss")) return 1.0;
  if (healthConditions.includes("obesity_prone")) return 1.2;

  switch (lifeStage) {
    case "PUPPY_UNDER_4MO": return 3.0;
    case "PUPPY_OVER_4MO":  return 2.0;
    case "SENIOR":          return 1.4;
    case "PREGNANT":        return 1.8; // mid-range; varies by trimester
    case "LACTATING":       return 2.5; // mid-range; varies by litter size
    case "ADULT":
      if (activityLevel === "WORKING")       return 4.0; // mid-range 2–5
      if (activityLevel === "HIGHLY_ACTIVE") return 3.0;
      if (activityLevel === "ACTIVE")        return 2.0;
      return isNeutered ? 1.6 : 1.8;
    default: return 1.6;
  }
}
```

### ME Calculation (`lib/nutrition/energy.ts`)

```typescript
export type MEMethod = "ATWATER_STANDARD" | "ATWATER_MODIFIED";

export function calculateME(
  proteinG: number,
  fatG: number,
  carbsG: number,
  method: MEMethod = "ATWATER_STANDARD"
): number {
  if (method === "ATWATER_STANDARD") {
    // Home-cooked: 4/9/4 — more accurate for fresh food
    return proteinG * 4.0 + fatG * 9.0 + carbsG * 4.0;
  }
  // Modified Atwater — designed for commercial kibble, underestimates fresh food by ~12%
  return proteinG * 3.5 + fatG * 8.5 + carbsG * 3.5;
}
```

### Dry Matter Basis (`lib/nutrition/dmb.ts`)

```typescript
/**
 * Convert as-fed nutrient amount to dry matter basis.
 * moisturePct is 0–100 (e.g., chicken breast ≈ 75% moisture)
 *
 * DMB = as-fed / (1 - moisture/100)
 */
export function asFedToDMB(asFedAmount: number, moisturePct: number): number {
  const dryMatterFraction = 1 - moisturePct / 100;
  if (dryMatterFraction <= 0) {
    throw new Error(`Invalid moisture: ${moisturePct}% leaves no dry matter`);
  }
  return asFedAmount / dryMatterFraction;
}

/**
 * Apply cooking moisture correction.
 * Cooking concentrates nutrients as water evaporates.
 * Raw chicken ≈ 75% moisture; cooked ≈ 65%.
 * The correction factor accounts for this concentration.
 */
export function applyCookingMoistureCorrection(
  rawMoisturePct: number,
  cookingMethod: CookingMethod
): number {
  const corrections: Record<CookingMethod, number> = {
    RAW:              0,
    LIGHTLY_COOKED:   5,  // loses ~5% moisture
    FULLY_COOKED:     10,
    PRESSURE_COOKED:  8,
  };
  return Math.max(0, rawMoisturePct - corrections[cookingMethod]);
}

/**
 * Apply heat degradation to heat-sensitive vitamins.
 * Thiamine (B1) and Folate degrade significantly during cooking.
 */
export function applyHeatDegradation(
  amount: number,
  nutrient: "B1_THIAMINE" | "FOLATE",
  cookingMethod: CookingMethod
): number {
  if (cookingMethod === "RAW") return amount;

  const retentionFactors: Record<string, Record<CookingMethod, number>> = {
    B1_THIAMINE: {
      RAW:             1.0,
      LIGHTLY_COOKED:  0.85,
      FULLY_COOKED:    0.70,
      PRESSURE_COOKED: 0.60,
    },
    FOLATE: {
      RAW:             1.0,
      LIGHTLY_COOKED:  0.85,
      FULLY_COOKED:    0.65,
      PRESSURE_COOKED: 0.50,
    },
  };

  return amount * retentionFactors[nutrient][cookingMethod];
}
```

### Per-1000-kcal Normalization (`lib/nutrition/normalization.ts`)

```typescript
/**
 * Normalize nutrient totals to a per-1000-kcal basis.
 * This is the canonical way to compare recipes of different energy densities.
 */
export function normalizePer1000Kcal(
  nutrients: NutrientValues,
  totalKcal: number
): NutrientValues {
  if (totalKcal === 0) return nutrients;

  const factor = 1000 / totalKcal;

  // Apply factor to every numeric field
  return Object.fromEntries(
    Object.entries(nutrients).map(([key, value]) => [
      key,
      typeof value === "number" ? value * factor : value,
    ])
  ) as NutrientValues;
}
```

### AAFCO Standards (`lib/nutrition/aafco.ts`)

```typescript
type AafcoLifeStage = "ADULT_MAINTENANCE" | "GROWTH_REPRODUCTION";

interface AafcoStandard {
  nutrient: string;
  unit: string;
  adultMin?: number;
  growthMin?: number;
  maxSafe?: number;
}

// Per 1000 kcal ME basis
export const AAFCO_STANDARDS_PER_1000KCAL: AafcoStandard[] = [
  // Macros (% DMB)
  { nutrient: "protein",    unit: "%DMB", adultMin: 18.0, growthMin: 22.5 },
  { nutrient: "fat",        unit: "%DMB", adultMin: 5.5,  growthMin: 8.5  },

  // Minerals (mg/1000 kcal)
  { nutrient: "calcium",    unit: "mg",   adultMin: 1250, growthMin: 3000, maxSafe: 4500 },
  { nutrient: "phosphorus", unit: "mg",   adultMin: 1000, growthMin: 2500, maxSafe: 4000 },
  { nutrient: "potassium",  unit: "mg",   adultMin: 1500, growthMin: 1500 },
  { nutrient: "sodium",     unit: "mg",   adultMin:  200, growthMin:  550 },
  { nutrient: "magnesium",  unit: "mg",   adultMin:  150, growthMin:  140, maxSafe: 560  },
  { nutrient: "iron",       unit: "mg",   adultMin:  10,  growthMin:  22,  maxSafe: 110  },
  { nutrient: "zinc",       unit: "mg",   adultMin:  20,  growthMin:  25,  maxSafe: 250  },
  { nutrient: "copper",     unit: "mg",   adultMin:   1.83, growthMin: 3.05, maxSafe: 7.3 },
  { nutrient: "manganese",  unit: "mg",   adultMin:   1.4,  growthMin: 1.4              },
  { nutrient: "selenium",   unit: "ug",   adultMin:  87.5,  growthMin: 87.5, maxSafe: 417 },
  { nutrient: "iodine",     unit: "ug",   adultMin: 218.75, growthMin: 218.75            },

  // Vitamins
  { nutrient: "vitaminA",   unit: "ug",   adultMin: 1515, growthMin: 1515, maxSafe: 75045 },
  { nutrient: "vitaminD",   unit: "ug",   adultMin:  3.4, growthMin:  3.4, maxSafe: 20.1 },
  { nutrient: "vitaminE",   unit: "mg",   adultMin:  12,  growthMin:  12                 },
  { nutrient: "thiamine",   unit: "mg",   adultMin:  0.56, growthMin: 0.56               },
  // ... remaining vitamins
];

export interface NutrientComplianceStatus {
  nutrient: string;
  actual: number;
  min?: number;
  max?: number;
  unit: string;
  status: "OK" | "DEFICIENT" | "EXCESSIVE" | "WARNING";
  percentOfMin: number;
}

export function checkAafcoCompliance(
  per1000Kcal: NutrientValues,
  dmbValues: NutrientValues,
  lifeStage: AafcoLifeStage
): NutrientComplianceStatus[] {
  return AAFCO_STANDARDS_PER_1000KCAL.map((std) => {
    const actual = getValueByNutrientKey(per1000Kcal, dmbValues, std.nutrient);
    const min = lifeStage === "GROWTH_REPRODUCTION" ? std.growthMin : std.adultMin;
    const max = std.maxSafe;

    let status: NutrientComplianceStatus["status"] = "OK";
    if (min !== undefined && actual < min) status = "DEFICIENT";
    if (max !== undefined && actual > max) status = "EXCESSIVE";
    if (min !== undefined && actual < min * 1.1 && actual >= min) status = "WARNING";

    return {
      nutrient: std.nutrient,
      actual,
      min,
      max,
      unit: std.unit,
      status,
      percentOfMin: min ? (actual / min) * 100 : 100,
    };
  });
}
```

### Main Calculation Engine (`lib/nutrition/engine.ts`)

```typescript
export function calculateRecipeNutrition(
  items: RecipeItemWithNutrients[],
  dog: DogProfile
): NutritionAnalysisResult {
  // Step 1: Scale each ingredient to its weight in the recipe
  const scaledItems = items.map((item) =>
    scaleNutrientsToWeight(item.nutrients, item.weightG)
  );

  // Step 2: Apply cooking corrections (moisture loss + vitamin degradation)
  const correctedItems = items.map((item, i) =>
    applyCookingCorrections(scaledItems[i], item.cookingMethod)
  );

  // Step 3: Sum all nutrients across all ingredients
  const totalAsFed = sumNutrientArrays(correctedItems);
  const totalWeightG = items.reduce((sum, i) => sum + i.weightG, 0);

  // Step 4: Calculate total ME using Standard Atwater for home-cooked
  const totalKcal = calculateME(
    totalAsFed.proteinG,
    totalAsFed.fatG,
    totalAsFed.carbsG,
    "ATWATER_STANDARD"
  );

  // Step 5: DER calculation for the dog
  const der = calculateDER(dog);

  // Step 6: Dry matter basis conversion
  // Combined moisture: weighted average across all ingredients
  const weightedMoisture = calculateWeightedAverageMoisture(items);
  const dmb = convertAllToDMB(totalAsFed, weightedMoisture);

  // Step 7: Per-1000-kcal normalization
  const per1000Kcal = normalizePer1000Kcal(totalAsFed, totalKcal);

  // Step 8: Days per batch
  const daysPerBatch = totalKcal > 0 ? totalKcal / der.der : 0;

  // Step 9: AAFCO compliance check
  const aafcoLifeStage: AafcoLifeStage =
    dog.lifeStage === "ADULT" || dog.lifeStage === "SENIOR"
      ? "ADULT_MAINTENANCE"
      : "GROWTH_REPRODUCTION";

  const aafco = checkAafcoCompliance(per1000Kcal, dmb, aafcoLifeStage);

  // Step 10: Mineral ratios
  const caPRatio =
    totalAsFed.phosphorusMg > 0
      ? totalAsFed.calciumMg / totalAsFed.phosphorusMg
      : 0;

  // Step 11: Omega ratio
  const totalOmega3 = totalAsFed.omega3ALA + totalAsFed.omega3EPA + totalAsFed.omega3DHA;
  const omega6To3Ratio = totalOmega3 > 0 ? totalAsFed.omega6LA / totalOmega3 : Infinity;

  // Step 12: Amino acid completeness
  const aminoAcidCompleteness = scoreAminoAcids(per1000Kcal, aafcoLifeStage);

  return {
    totalWeightG,
    totalKcal,
    der,
    daysPerBatch,
    asFed: totalAsFed,
    dmb,
    per1000Kcal,
    aafco,
    nrc: checkNrcCompliance(per1000Kcal, dog),
    caPRatio,
    omega6To3Ratio,
    aminoAcidCompleteness,
  };
}
```

---

## 8. USDA API Integration

### Proxy Strategy

The USDA API key is stored in an environment variable that is never exposed to the client. All USDA requests go through Next.js Route Handlers which run only on the server. The browser never calls `api.nal.usda.gov` directly.

```
Browser → GET /api/ingredients/search?q=chicken
          → Route Handler reads USDA_API_KEY from process.env
          → fetch("https://api.nal.usda.gov/fdc/v1/foods/search?...")
          → parse → write to DB cache → return to browser
```

### USDA Client (`lib/usda/client.ts`)

```typescript
const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

// Priority order: SR Legacy preferred, then Foundation, skip Branded
const PREFERRED_DATA_TYPES = ["SR Legacy", "Foundation Foods", "Survey (FNDDS)"];

export async function searchFoods(query: string, pageSize = 20) {
  const url = new URL(`${USDA_BASE}/foods/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("dataType", PREFERRED_DATA_TYPES.join(","));
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("api_key", process.env.USDA_API_KEY!);

  const res = await fetch(url.toString(), {
    next: { revalidate: 86400 }, // Next.js fetch cache: 24 hours
  });

  if (!res.ok) throw new Error(`USDA search failed: ${res.status}`);
  return res.json();
}

export async function getFoodDetails(fdcId: number) {
  const url = `${USDA_BASE}/food/${fdcId}?api_key=${process.env.USDA_API_KEY}`;

  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 * 90 }, // 90-day cache for nutrient data
  });

  if (!res.ok) throw new Error(`USDA food detail failed: ${fdcId}`);
  return res.json();
}
```

### Nutrient ID Map (`lib/usda/nutrient-map.ts`)

```typescript
// Maps USDA FDC nutrient IDs to our NutrientValues fields
export const NUTRIENT_ID_MAP: Record<number, keyof NutrientValues> = {
  // Proximate
  1003: "proteinG",
  1004: "fatG",
  1005: "carbsG",
  1008: "energyKcal",
  1051: "moistureG",
  1079: "fiberG",

  // Minerals
  1087: "calciumMg",
  1091: "phosphorusMg",
  1092: "potassiumMg",
  1093: "sodiumMg",
  1090: "magnesiumMg",
  1089: "ironMg",
  1095: "zincMg",
  1098: "copperMg",
  1101: "manganeseMg",
  1103: "seleniumUg",
  1100: "iodineUg",

  // Vitamins
  1106: "vitaminAUg",
  1110: "vitaminDUg",
  1109: "vitaminEMg",
  1165: "vitaminB1Mg",     // Thiamine
  1166: "vitaminB2Mg",     // Riboflavin
  1175: "vitaminB6Mg",
  1178: "vitaminB12Ug",
  1177: "folateMcg",
  1180: "cholineMg",

  // Fatty acids
  1269: "omega6LA",        // 18:2 Linoleic acid
  1404: "omega3ALA",       // 18:3 ALA
  1278: "omega3EPA",       // 20:5 EPA
  1272: "omega3DHA",       // 22:6 DHA

  // Amino acids
  1010: "arginine",
  1011: "histidine",
  1014: "isoleucine",
  1015: "leucine",
  1016: "lysine",
  1017: "methionine",
  1018: "phenylalanine",
  1020: "threonine",
  1023: "tryptophan",
  1024: "valine",
};
```

### Parser (`lib/usda/parser.ts`)

```typescript
export function parseFdcFoodToNutrients(fdcFood: FdcFoodResponse): NutrientValues {
  const defaults = createZeroNutrientValues();

  for (const fn of fdcFood.foodNutrients) {
    const field = NUTRIENT_ID_MAP[fn.nutrient.id];
    if (!field) continue;

    // Amount is per 100g as-fed in FDC responses
    (defaults as Record<string, number>)[field] = fn.amount ?? 0;
  }

  return defaults;
}

export function parseFdcFoodToIngredient(fdcFood: FdcFoodResponse): {
  ingredient: Omit<Ingredient, "nutrients">;
  nutrients: NutrientValues;
} {
  return {
    ingredient: {
      id: String(fdcFood.fdcId),
      fdcId: fdcFood.fdcId,
      description: fdcFood.description,
      dataType: mapDataType(fdcFood.dataType),
      foodCategory: fdcFood.foodCategory?.description ?? null,
      moisturePct: getMoistureFromNutrients(fdcFood.foodNutrients),
      cachedAt: new Date(),
      updatedAt: new Date(),
    },
    nutrients: parseFdcFoodToNutrients(fdcFood),
  };
}
```

### DB Write-Through Cache (`app/api/ingredients/[fdcId]/route.ts`)

```typescript
export async function GET(
  _request: Request,
  { params }: { params: { fdcId: string } }
): Promise<Response> {
  const fdcId = parseInt(params.fdcId);

  // 1. Check DB cache first
  const cached = await prisma.ingredient.findUnique({
    where: { fdcId },
    include: { nutrients: true },
  });

  // 2. Return cache if fresh (< 90 days)
  if (cached) {
    const staleDays = differenceInDays(new Date(), cached.cachedAt);
    if (staleDays < 90) {
      return Response.json(transformIngredient(cached));
    }
  }

  // 3. Cache miss or stale — fetch from USDA
  const fdcFood = await getFoodDetails(fdcId);
  const { ingredient, nutrients } = parseFdcFoodToIngredient(fdcFood);

  // 4. Upsert into DB (write-through)
  await prisma.ingredient.upsert({
    where: { fdcId },
    create: {
      ...ingredient,
      nutrients: {
        createMany: {
          data: nutrientValuesToRows(nutrients, String(fdcId)),
          skipDuplicates: true,
        },
      },
    },
    update: {
      ...ingredient,
      updatedAt: new Date(),
      nutrients: {
        deleteMany: { ingredientId: String(fdcId) },
        createMany: { data: nutrientValuesToRows(nutrients, String(fdcId)) },
      },
    },
  });

  return Response.json(transformIngredient({ ...ingredient, nutrients }));
}
```

---

## 9. Implementation Phases

### Phase 1 — Foundation (Week 1)

**Goal**: Running app with DB connectivity, no business logic yet.

1. Initialize Next.js 15 with `create-next-app` using TypeScript and Tailwind options
2. Install dependencies: `pnpm add prisma @prisma/client @neondatabase/serverless zustand @tanstack/react-query @tanstack/react-query-devtools`
3. Install dev dependencies: `pnpm add -D vitest @vitejs/plugin-react @testing-library/react`
4. Initialize Prisma: `pnpm prisma init`
5. Create Neon project, copy connection string to `.env.local`
6. Write full `prisma/schema.prisma` (all models from Section 4)
7. Run `pnpm prisma migrate dev --name init`
8. Create `lib/db.ts` Prisma singleton with Neon HTTP driver
9. Set up `app/providers.tsx` with TanStack Query provider
10. Update `app/layout.tsx` to include providers

**Deliverables**: `pnpm prisma studio` shows empty tables; `GET /api/dogs` returns `[]`

### Phase 2 — Dog Profiles (Week 1–2)

**Goal**: Full CRUD for dogs.

1. Build Route Handlers: `/api/dogs/route.ts` and `/api/dogs/[dogId]/route.ts`
2. Create `lib/nutrition/types.ts` with `DogProfile`, `LifeStage`, `ActivityLevel` types
3. Build `components/dogs/DogForm.tsx` with shadcn form components (name, weight, age, life stage, sex, neutered)
4. Build `app/dogs/page.tsx` (RSC fetching all dogs via Prisma directly)
5. Build `app/dogs/new/page.tsx` (RSC shell + DogForm client component)
6. Build `app/dogs/[dogId]/page.tsx` (RSC showing dog details)
7. Add `useDogProfile` hook with TanStack Query mutations for create/update/delete
8. Write Vitest tests for dog API routes using mock Prisma client

**Deliverables**: Can create, view, edit, and delete dog profiles.

### Phase 3 — USDA Integration (Week 2)

**Goal**: Ingredient search and nutrient caching working.

1. Obtain USDA API key from `fdc.nal.usda.gov` (free, instant)
2. Add `USDA_API_KEY` to `.env.local`
3. Write `lib/usda/nutrient-map.ts` with all 40+ nutrient ID mappings
4. Write `lib/usda/client.ts` with `searchFoods` and `getFoodDetails`
5. Write `lib/usda/parser.ts` with `parseFdcFoodToNutrients` and `parseFdcFoodToIngredient`
6. Build `/api/ingredients/search/route.ts` (proxy + SearchCache table)
7. Build `/api/ingredients/[fdcId]/route.ts` (proxy + DB write-through cache)
8. Build `components/recipes/IngredientSearch.tsx` with debounced search and Combobox UI
9. Write `hooks/useIngredientSearch.ts`
10. Vitest tests for parser with real FDC JSON fixtures

**Deliverables**: Can search "chicken breast" and see results; nutrients stored in DB on first load, served from DB on subsequent loads.

### Phase 4 — Nutrition Calculation Engine (Week 3)

**Goal**: Pure calculation library fully tested.

1. Write `lib/nutrition/energy.ts` — `calculateRER`, `calculateDER`, `calculateME`
2. Write `lib/nutrition/dmb.ts` — `asFedToDMB`, `applyCookingMoistureCorrection`, `applyHeatDegradation`
3. Write `lib/nutrition/normalization.ts` — `normalizePer1000Kcal`
4. Write `lib/nutrition/aafco.ts` — standards tables + `checkAafcoCompliance`
5. Write `lib/nutrition/nrc.ts` — NRC MR/RA tables + `checkNrcCompliance`
6. Write `lib/nutrition/amino-acids.ts` — `scoreAminoAcids`
7. Write `lib/nutrition/fatty-acids.ts` — omega ratio, EPA/DHA adequacy check
8. Write `lib/nutrition/minerals.ts` — Ca:P ratio validation
9. Write `lib/nutrition/engine.ts` — `calculateRecipeNutrition` combining all above
10. Write comprehensive Vitest tests for every formula (use known USDA food values to validate expected outputs)

**Deliverables**: All calculation functions pass tests; engine produces correct results for a test recipe with known inputs.

### Phase 5 — Recipe Builder UI (Week 3–4)

**Goal**: Interactive recipe builder with live nutrition analysis.

1. Build `stores/recipeStore.ts` (Zustand)
2. Build Recipe API routes: `/api/recipes/`, `/api/recipes/[recipeId]/`, `/api/recipes/[recipeId]/items/`
3. Build `hooks/useRecipe.ts` with TanStack Query mutations
4. Build `hooks/useNutritionAnalysis.ts` (pure calculation, no API call)
5. Build `components/recipes/RecipeBuilder.tsx` — layout with ingredient list and nutrition panel side by side
6. Build `components/recipes/IngredientRow.tsx` — weight slider/input with unit toggle (g/oz)
7. Build `components/nutrition/NutritionPanel.tsx` — tabbed: Macros, Minerals, Vitamins, Amino Acids
8. Build `components/nutrition/NutrientGauge.tsx` — radial SVG gauge showing % of AAFCO minimum
9. Build `app/dogs/[dogId]/recipes/new/page.tsx` and `[recipeId]/page.tsx`
10. Wire up RSC data fetch → Zustand initialization

**Deliverables**: Can add ingredients to a recipe and see live AAFCO compliance update as weights change.

### Phase 6 — Supplements + Advanced Features (Week 4)

**Goal**: Complete the domain-specific features.

1. Write `lib/supplements/library.ts` with all static supplement definitions
2. Build `/api/supplements/route.ts`
3. Build `components/recipes/SupplementPanel.tsx`
4. Add Ca:P ratio display with red/amber/green indicator
5. Add omega-6:omega-3 ratio display
6. Build `components/nutrition/AminoAcidTable.tsx` with completeness scoring
7. Add cooking method selector to RecipeBuilder that triggers recalculation
8. Build `components/nutrition/MineralRatioDisplay.tsx`
9. Add "Days per Batch" calculation display linked to DER

**Deliverables**: Supplement addition works; Ca:P ratio and omega ratios display correctly; amino acid completeness shown.

### Phase 7 — PDF Reports (Week 5)

**Goal**: Generate and download PDF nutrition reports.

1. Install `@react-pdf/renderer`
2. Write `lib/pdf/ReportDocument.tsx` — full PDF layout with dog profile, recipe ingredients table, full nutrient breakdown, AAFCO comparison, gauges as static SVG, supplement list
3. Build `/api/reports/[recipeId]/pdf/route.ts` — runs calculation engine on server, renders PDF with `renderToBuffer`, returns `application/pdf` response
4. Add "Download PDF Report" button to recipe page that calls this route
5. Test PDF generation locally with various recipes

**Deliverables**: Clicking "Download PDF" produces a well-formatted PDF with complete nutrition analysis.

### Phase 8 — Auth + Deployment (Week 5–6)

**Goal**: Multi-user app deployed to Vercel.

1. Install and configure NextAuth.js (or Clerk for faster setup) with Google OAuth
2. Add `userId` to all DB queries (scope data per user)
3. Add auth middleware to all API routes
4. Create Vercel project linked to GitHub repo
5. Add Neon integration in Vercel marketplace (auto-injects `DATABASE_URL`)
6. Add all environment variables to Vercel dashboard
7. Run `pnpm prisma migrate deploy` as part of Vercel build command
8. Set up preview environments using Neon database branching
9. Configure Vercel cron (optional) to purge stale SearchCache entries

**Deliverables**: App live at `*.vercel.app` with login required; each user sees only their own dogs and recipes.

---

## 10. Deployment Guide

### 10.1 Neon Setup

**Step 1**: Create account at `neon.tech`. Create a new project named `dog-nutrients`.

**Step 2**: In the Neon dashboard, go to Connection Details. You will see two connection strings:
- **Pooled connection** (`postgresql://...@pooler.neon.tech/...`) — use for `DATABASE_URL` (runtime queries via connection pooler)
- **Direct connection** (`postgresql://...@ep-...neon.tech/...`) — use for `DIRECT_URL` (Prisma migrations only)

**Step 3**: Copy both strings. The pooled URL appends `?sslmode=require&pgbouncer=true`.

**Step 4**: For development, create a separate Neon **branch** named `dev` (under Branches in the dashboard). Use the dev branch's connection string in `.env.local`. This isolates development data from production.

**Step 5**: `.env.local` contents:

```bash
DATABASE_URL="postgresql://user:password@pooler.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
USDA_API_KEY="your_usda_fdc_api_key"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**Step 6**: Run `pnpm prisma migrate dev --name init`. This applies migrations to the Neon dev branch.

### 10.2 Prisma Neon Driver Configuration

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Required for Node.js environments (Vercel Functions)
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

This singleton pattern prevents exhausting the connection pool during Next.js hot-reloads in development.

### 10.3 Vercel Setup

**Step 1**: Push repository to GitHub.

**Step 2**: Go to `vercel.com/new` → Import Git Repository → select your repo.

**Step 3**: In the Vercel project settings, go to Integrations → Browse Marketplace → add the **Neon** integration. This automatically injects `DATABASE_URL` and `DIRECT_URL` from your Neon project into Vercel's environment.

**Step 4**: Add remaining environment variables in Vercel → Settings → Environment Variables:

| Variable | Value | Environment |
|---|---|---|
| `USDA_API_KEY` | Your USDA FDC API key | Production, Preview |
| `NEXTAUTH_SECRET` | Random 32-byte base64 string | Production, Preview |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production only |

**Step 5**: Configure the build command in `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "dev": "prisma generate && next dev",
    "postinstall": "prisma generate"
  }
}
```

The `prisma migrate deploy` in the build command applies any pending migrations to production during each deployment. The `directUrl` in the Prisma schema is used for this (bypasses the connection pooler, which does not support migration DDL statements).

**Step 6**: Deploy. Vercel will run the build command, which generates the Prisma client, runs migrations, and builds the Next.js app.

### 10.4 Environment Variables Reference

| Variable | Required | Secret? | Where Used |
|---|---|---|---|
| `DATABASE_URL` | Yes | Yes | Prisma runtime (pooled) |
| `DIRECT_URL` | Yes | Yes | Prisma migrations only |
| `USDA_API_KEY` | Yes | Yes | Route Handlers only — never client-exposed |
| `NEXTAUTH_SECRET` | Yes | Yes | NextAuth session encryption |
| `NEXTAUTH_URL` | Yes | No | NextAuth redirect URLs |

Never prefix USDA or database variables with `NEXT_PUBLIC_`. Only variables prefixed with `NEXT_PUBLIC_` are bundled into the client build. Everything else is server-only.

### 10.5 Neon Database Branching for CI/CD

Neon supports database branches — isolated copies of the schema + data — similar to git branches. This enables safe preview deployments.

**Workflow**:
1. Developer opens a pull request → Vercel creates a preview deployment
2. A GitHub Action (or Neon GitHub integration) creates a Neon branch named `preview/pr-{number}`
3. Vercel preview deployment's `DATABASE_URL` points to the PR-specific Neon branch
4. `prisma migrate deploy` runs against the preview branch (safe, isolated)
5. PR is merged → Vercel deploys to production → migrations run against main Neon branch
6. PR Neon branch is automatically deleted

**GitHub Action for Neon Branch Creation** (`.github/workflows/preview.yml`):

```yaml
name: Neon Preview Branch
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  create-branch:
    runs-on: ubuntu-latest
    steps:
      - uses: neondatabase/create-branch-action@v5
        with:
          project_id: ${{ secrets.NEON_PROJECT_ID }}
          branch_name: preview/pr-${{ github.event.number }}
          api_key: ${{ secrets.NEON_API_KEY }}
        id: create-branch
      - name: Update Vercel Preview ENV
        run: |
          vercel env add DATABASE_URL preview \
            --value "${{ steps.create-branch.outputs.db_url_with_pooler }}"
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### 10.6 Production Migration Safety

Migrations run automatically on every Vercel deployment via `prisma migrate deploy`. To minimize risk:

- Never write a migration that drops columns without a prior deploy that stops reading them (expand-contract pattern)
- Neon's serverless architecture means there is no "down time" for schema changes on non-blocking DDL
- If a migration fails during build, Vercel cancels the deployment and rolls back to the previous version — the database is never left in a half-migrated state because Prisma wraps each migration in a transaction

---

## 11. Key Technical Challenges

### Challenge 1: Prisma in Next.js Server Components and Route Handlers

**Problem**: Prisma was designed for persistent Node.js servers. In Vercel's serverless/edge environment, each function invocation may spawn a new process, creating connection pool exhaustion if a new `PrismaClient` is instantiated per request.

**Solution (Next.js specific)**: The `lib/db.ts` singleton pattern attaches the Prisma instance to `globalThis`. In development, Next.js hot-module replacement re-evaluates modules, creating new instances — `globalThis` persists across HMR cycles, preventing pool growth. In production, each Vercel function instance creates exactly one client.

The `@neondatabase/serverless` driver with the `PrismaNeon` adapter uses HTTP-based connections rather than TCP, which is compatible with serverless cold starts and Vercel's Edge Runtime. This means no persistent TCP connection to maintain.

### Challenge 2: Real-Time Nutrition Calculation Without Expensive Re-fetching

**Problem**: Every time a user changes an ingredient weight, the nutrition panel must update instantly. Naively, this would trigger API calls to recalculate.

**Solution**: The calculation engine in `lib/nutrition/engine.ts` is pure TypeScript with zero async operations. It runs entirely in the browser. The ingredient nutrient data (from USDA, ~150 numbers per ingredient) is fetched once and stored in the Zustand `nutrientCache` map. After that, all calculations are synchronous in-memory operations. A recipe with 10 ingredients recalculates in under 1ms. The `useNutritionAnalysis` hook uses `useMemo` so it only recalculates when the recipe items array actually changes.

The RSC data-fetching pattern helps here: when the recipe page first loads, the Server Component fetches the full recipe including all ingredient nutrients in a single DB query, serializes them as JSON, and passes them as props to the `RecipeBuilder` client component, which seeds the Zustand store. No waterfall of API calls on page load.

### Challenge 3: USDA API Rate Limiting and Caching in Serverless

**Problem**: The USDA FDC API has rate limits. In a serverless environment with no persistent memory, a naive proxy would re-fetch on every cold start.

**Solution (layered cache)**:

```
Request for fdcId X
    │
    ├─► Next.js fetch cache (in-memory per warm function instance) — microseconds
    │
    ├─► Neon DB IngredientNutrient table (90-day TTL) — ~5ms
    │
    └─► USDA API (cache miss only) — ~200-500ms → writes back to Neon
```

The `SearchCache` table handles search queries separately (24-hour TTL). The `next: { revalidate }` option on the `fetch()` call inside the Route Handler activates Next.js's built-in HTTP cache on Vercel's CDN, meaning popular ingredient lookups are served from Vercel's edge without touching Neon or USDA at all.

### Challenge 4: Dry Matter Basis With Variable Moisture

**Problem**: Each ingredient has different moisture content. A recipe mixing raw chicken (75% moisture), sweet potato (77%), and fish oil (0%) requires careful moisture handling to produce accurate DMB values. Simple averaging is incorrect; it must be a weighted average by mass.

**Solution**: Calculate weighted average moisture across all recipe ingredients, then apply the single conversion formula. See `calculateWeightedAverageMoisture()` in `lib/nutrition/engine.ts`.

### Challenge 5: Ca:P Ratio Correction in Meat-Heavy Diets

**Problem**: All fresh meat is naturally phosphorus-heavy (Ca:P often 1:10 to 1:20). AAFCO mandates Ca:P between 1:1 and 2:1. The app must not only flag this deficiency but guide users toward the correct calcium carbonate or citrate dose.

**Solution**: After checking the Ca:P ratio, if it is below 1:1, `lib/nutrition/minerals.ts` calculates the exact gram quantity of calcium carbonate (400mg Ca/g) or calcium citrate (210mg Ca/g) needed to reach a target ratio of 1.3:1 (middle of the safe range). This suggested dose is surfaced in the UI as an actionable recommendation next to the Ca:P gauge.

### Challenge 6: PDF Generation in a Serverless Environment

**Problem**: `@react-pdf/renderer` requires Node.js and cannot run in the Edge Runtime. PDF generation for a large recipe can take 1–3 seconds.

**Solution**: The `/api/reports/[recipeId]/pdf/route.ts` Route Handler is explicitly configured to use the Node.js runtime (not Edge) via the `export const runtime = "nodejs"` declaration. Vercel's Node.js serverless functions support up to 60 seconds execution time, well within the budget. The Route Handler runs `calculateRecipeNutrition` on the server (same pure function, no client-side state needed) and calls `renderToBuffer` from `@react-pdf/renderer`. The response sets `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="recipe-report.pdf"`.

### Challenge 7: Type Safety Across the Full Stack

**Problem**: In the Express + React split architecture, types were duplicated between the server and client codebases. With Next.js in a single repository, types can be shared, but RSC and Client Component boundaries require careful handling — you cannot pass non-serializable values (like class instances, functions, or Dates as objects) from Server to Client Components.

**Solution**: All data crossing the RSC/Client Component boundary uses plain JSON-serializable objects. Prisma's `DateTime` fields are serialized to ISO strings before being passed as props. The `NutrientValues` interface in `lib/nutrition/types.ts` is a plain object with only number fields — safe to pass anywhere. Zod schemas are used in Route Handlers to validate request bodies, and the inferred Zod types align with the shared TypeScript interfaces, giving end-to-end type safety from the form input to the DB write.

---

### Critical Files for Implementation

- `/prisma/schema.prisma` — Single source of truth for the entire database schema; all models, enums, and relations are defined here; drives Prisma client type generation
- `/lib/nutrition/engine.ts` — Orchestrates all nutrition calculations; the central function `calculateRecipeNutrition` ties together energy, DMB, normalization, AAFCO compliance, mineral ratios, and amino acid scoring
- `/lib/usda/nutrient-map.ts` — Maps USDA FDC nutrient IDs to the app's internal `NutrientValues` fields; if this mapping is wrong, every nutrient value in the app will be wrong
- `/app/api/ingredients/[fdcId]/route.ts` — The write-through cache handler; implements the DB-first, USDA-fallback strategy that all ingredient nutrient lookups depend on
- `/lib/db.ts` — Prisma client singleton with Neon serverless adapter; correct implementation is required for the app to function in both development (hot-reload) and production (serverless) environments