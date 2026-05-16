-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "LifeStage" AS ENUM ('PUPPY_UNDER_4MO', 'PUPPY_OVER_4MO', 'ADULT', 'SENIOR', 'PREGNANT', 'LACTATING');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'MODERATE', 'ACTIVE', 'WORKING', 'HIGHLY_ACTIVE');

-- CreateEnum
CREATE TYPE "CookingMethod" AS ENUM ('RAW', 'LIGHTLY_COOKED', 'FULLY_COOKED', 'PRESSURE_COOKED');

-- CreateEnum
CREATE TYPE "FdcDataType" AS ENUM ('SR_LEGACY', 'FOUNDATION', 'SURVEY_FNDDS', 'BRANDED');

-- CreateTable
CREATE TABLE "dogs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "ageMonths" INTEGER NOT NULL,
    "sex" "Sex" NOT NULL,
    "lifeStage" "LifeStage" NOT NULL,
    "isNeutered" BOOLEAN NOT NULL DEFAULT false,
    "activityLevel" "ActivityLevel" NOT NULL DEFAULT 'MODERATE',
    "healthConditions" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "batchSizeG" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "cookingMethod" "CookingMethod" NOT NULL DEFAULT 'RAW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "weightG" DOUBLE PRECISION NOT NULL,
    "isCooked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "fdcId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "dataType" "FdcDataType" NOT NULL,
    "foodCategory" TEXT,
    "moisturePct" DOUBLE PRECISION,
    "isCooked" BOOLEAN NOT NULL DEFAULT false,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_nutrients" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "nutrientId" INTEGER NOT NULL,
    "nutrientName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unitName" TEXT NOT NULL,

    CONSTRAINT "ingredient_nutrients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_cache" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_dogId_idx" ON "recipes"("dogId");

-- CreateIndex
CREATE INDEX "recipe_items_recipeId_idx" ON "recipe_items"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_fdcId_key" ON "ingredients"("fdcId");

-- CreateIndex
CREATE INDEX "ingredients_description_idx" ON "ingredients"("description");

-- CreateIndex
CREATE INDEX "ingredient_nutrients_ingredientId_idx" ON "ingredient_nutrients"("ingredientId");

-- CreateIndex
CREATE INDEX "ingredient_nutrients_nutrientId_idx" ON "ingredient_nutrients"("nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_nutrients_ingredientId_nutrientId_key" ON "ingredient_nutrients"("ingredientId", "nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "search_cache_query_key" ON "search_cache"("query");

-- CreateIndex
CREATE INDEX "search_cache_query_idx" ON "search_cache"("query");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_nutrients" ADD CONSTRAINT "ingredient_nutrients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
