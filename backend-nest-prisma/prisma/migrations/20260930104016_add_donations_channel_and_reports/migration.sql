-- CreateEnum
CREATE TYPE "DonationChannelType" AS ENUM ('BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "DonationChannelAccountType" AS ENUM ('MERCHANT', 'PERSONAL', 'AGENT');

-- CreateEnum
CREATE TYPE "DonationPurpose" AS ENUM ('GENERAL_FUND', 'CONSTRUCTION_EXPANSION', 'ORPHAN_MADRASAH', 'RAMADAN_IFTAR', 'ZAKAT_SADAQAH', 'JANAZA_FUND');

-- CreateEnum
CREATE TYPE "DonationChannelStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'FLAGGED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "MosqueDonationChannel" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "channelType" "DonationChannelType" NOT NULL,
    "accountType" "DonationChannelAccountType" NOT NULL DEFAULT 'PERSONAL',
    "purpose" "DonationPurpose" NOT NULL DEFAULT 'GENERAL_FUND',
    "accountNumber" VARCHAR(50) NOT NULL,
    "accountTitle" VARCHAR(100) NOT NULL,
    "bankName" VARCHAR(100),
    "branchName" VARCHAR(100),
    "routingNumber" VARCHAR(50),
    "paymentInstructions" TEXT,
    "qrCodeImageUrl" VARCHAR(255),
    "status" "DonationChannelStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "disputeCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueDonationChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationReport" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MosqueDonationChannel_mosqueId_status_idx" ON "MosqueDonationChannel"("mosqueId", "status");

-- CreateIndex
CREATE INDEX "MosqueDonationChannel_channelType_status_idx" ON "MosqueDonationChannel"("channelType", "status");

-- CreateIndex
CREATE INDEX "DonationReport_channelId_status_idx" ON "DonationReport"("channelId", "status");

-- AddForeignKey
ALTER TABLE "MosqueDonationChannel" ADD CONSTRAINT "MosqueDonationChannel_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueDonationChannel" ADD CONSTRAINT "MosqueDonationChannel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueDonationChannel" ADD CONSTRAINT "MosqueDonationChannel_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationReport" ADD CONSTRAINT "DonationReport_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "MosqueDonationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationReport" ADD CONSTRAINT "DonationReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
