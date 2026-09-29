-- AlterEnum
ALTER TYPE "MosqueStaffRole" ADD VALUE IF NOT EXISTS 'MOSQUE_ADMIN';

-- AlterTable
ALTER TABLE "MosqueRoleClaim" ADD COLUMN IF NOT EXISTS "documentUrl" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MosqueStaff_mosqueId_role_isVerified_idx" ON "MosqueStaff"("mosqueId", "role", "isVerified");
CREATE INDEX IF NOT EXISTS "MosqueStaff_userId_isVerified_idx" ON "MosqueStaff"("userId", "isVerified");
CREATE INDEX IF NOT EXISTS "MosqueRoleClaim_userId_status_idx" ON "MosqueRoleClaim"("userId", "status");
