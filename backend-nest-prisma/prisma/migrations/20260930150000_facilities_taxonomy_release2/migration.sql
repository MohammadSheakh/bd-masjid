-- CreateTable
CREATE TABLE IF NOT EXISTS "MosqueFacility" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "totalCapacity" INTEGER,
    "toiletCount" INTEGER,
    "hasSeparateWudu" BOOLEAN DEFAULT false,
    "wuduCapacity" INTEGER,
    "hasFemalePrayerSpace" BOOLEAN DEFAULT false,
    "femaleCapacity" INTEGER,
    "hasWheelchairAccess" BOOLEAN DEFAULT false,
    "hasRamp" BOOLEAN DEFAULT false,
    "hasAirConditioning" BOOLEAN DEFAULT false,
    "hasFan" BOOLEAN DEFAULT true,
    "hasJanazaService" BOOLEAN DEFAULT false,
    "hasParkingCar" BOOLEAN DEFAULT false,
    "hasParkingBike" BOOLEAN DEFAULT false,
    "hasLibraryMaktab" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueFacility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MosqueFacility_mosqueId_key" ON "MosqueFacility"("mosqueId");
CREATE INDEX IF NOT EXISTS "MosqueFacility_hasFemalePrayerSpace_hasWheelchairAccess_idx" ON "MosqueFacility"("hasFemalePrayerSpace", "hasWheelchairAccess");
CREATE INDEX IF NOT EXISTS "MosqueFacility_hasAirConditioning_idx" ON "MosqueFacility"("hasAirConditioning");
CREATE INDEX IF NOT EXISTS "MosqueFacility_totalCapacity_idx" ON "MosqueFacility"("totalCapacity");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MosqueFacility_mosqueId_fkey'
    ) THEN
        ALTER TABLE "MosqueFacility" ADD CONSTRAINT "MosqueFacility_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
