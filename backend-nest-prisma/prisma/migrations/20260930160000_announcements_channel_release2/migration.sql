-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnnouncementCategory') THEN
        CREATE TYPE "AnnouncementCategory" AS ENUM (
            'GENERAL',
            'JUMUAH_KHUTBAH',
            'EMERGENCY_ALERT',
            'RAMADAN',
            'JANAZA',
            'EID',
            'MAINTENANCE'
        );
    END IF;
END $$;

-- AlterTable
ALTER TABLE "MosqueAnnouncement" 
  ADD COLUMN IF NOT EXISTS "category" "AnnouncementCategory" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "authorRole" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MosqueAnnouncement_category_createdAt_idx" ON "MosqueAnnouncement"("category", "createdAt");
CREATE INDEX IF NOT EXISTS "MosqueAnnouncement_expiresAt_idx" ON "MosqueAnnouncement"("expiresAt");
