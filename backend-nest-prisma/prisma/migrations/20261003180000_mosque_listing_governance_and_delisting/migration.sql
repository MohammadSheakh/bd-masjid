-- AlterTable Mosque: Add isListed and unlisted audit columns
ALTER TABLE "Mosque" ADD COLUMN IF NOT EXISTS "isListed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Mosque" ADD COLUMN IF NOT EXISTS "unlistedReason" TEXT;
ALTER TABLE "Mosque" ADD COLUMN IF NOT EXISTS "unlistedAt" TIMESTAMP(3);
ALTER TABLE "Mosque" ADD COLUMN IF NOT EXISTS "unlistedById" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Mosque_isListed_isDeleted_idx" ON "Mosque"("isListed", "isDeleted");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Mosque_unlistedById_fkey'
  ) THEN
    ALTER TABLE "Mosque" ADD CONSTRAINT "Mosque_unlistedById_fkey" FOREIGN KEY ("unlistedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
