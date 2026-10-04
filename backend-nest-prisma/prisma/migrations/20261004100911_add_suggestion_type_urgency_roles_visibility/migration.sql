-- CreateEnum
CREATE TYPE "SuggestionType" AS ENUM ('SUGGESTION', 'COMPLAINT', 'IMPROVEMENT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SuggestionUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SuggestionVisibility" AS ENUM ('COMMITTEE_ONLY', 'PUBLIC');

-- AlterTable
ALTER TABLE "AuditConfig" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MosqueRoleClaim" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "phoneNumber" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MosqueSuggestion" ADD COLUMN     "submitterName" TEXT,
ADD COLUMN     "submitterPhone" TEXT,
ADD COLUMN     "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" "SuggestionType" NOT NULL DEFAULT 'SUGGESTION',
ADD COLUMN     "urgency" "SuggestionUrgency" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "visibility" "SuggestionVisibility" NOT NULL DEFAULT 'COMMITTEE_ONLY';

-- CreateIndex
CREATE INDEX "MosqueSuggestion_mosqueId_visibility_createdAt_idx" ON "MosqueSuggestion"("mosqueId", "visibility", "createdAt");
