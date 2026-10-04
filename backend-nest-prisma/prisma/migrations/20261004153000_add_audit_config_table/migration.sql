-- CreateTable
CREATE TABLE "AuditConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "AuditConfig_pkey" PRIMARY KEY ("id")
);

-- Seed default singleton row if not exists
INSERT INTO "AuditConfig" ("id", "enabled", "updatedAt")
VALUES ('default', true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
