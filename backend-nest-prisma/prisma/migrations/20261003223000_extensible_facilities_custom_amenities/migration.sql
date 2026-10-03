-- AlterTable
ALTER TABLE "MosqueFacility" ADD COLUMN IF NOT EXISTS "customAmenities" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "MosqueSuggestion" ADD COLUMN IF NOT EXISTS "suggestedFacilities" JSONB;
