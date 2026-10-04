-- AlterTable
ALTER TABLE "MosqueDonationChannel" ADD COLUMN     "creatorImageUrl" VARCHAR(255),
ADD COLUMN     "creatorName" VARCHAR(100),
ADD COLUMN     "creatorRole" VARCHAR(50),
ADD COLUMN     "roleAttestations" JSONB DEFAULT '[]',
ADD COLUMN     "verifiedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[];
