-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('document', 'image', 'video', 'unknown');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'moderator', 'user');

-- CreateEnum
CREATE TYPE "UserAuthProvider" AS ENUM ('local', 'google');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('web', 'ios', 'android', 'desktop');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('REGULAR', 'OCCASIONAL', 'NONE');

-- CreateEnum
CREATE TYPE "AuditSource" AS ENUM ('ADMIN_API', 'SYSTEM', 'JOB', 'PROVIDER');

-- CreateEnum
CREATE TYPE "MosqueStaffRole" AS ENUM ('IMAM', 'MUAZZIN', 'KHATIB', 'KHADEM', 'COMMITTEE_PRESIDENT', 'COMMITTEE_SECRETARY', 'COMMITTEE_MEMBER');

-- CreateEnum
CREATE TYPE "RoleClaimStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DonationMethodType" AS ENUM ('BKASH', 'NAGAD', 'ROCKET', 'UPAY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "DonationAccountType" AS ENUM ('MERCHANT', 'PERSONAL', 'BANK_ACCOUNT');

-- CreateEnum
CREATE TYPE "MosqueOperationalStatus" AS ENUM ('OPEN', 'TEMPORARILY_CLOSED', 'PERMANENTLY_CLOSED', 'UNDER_CONSTRUCTION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MosqueVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SettingsType" AS ENUM ('aboutUs', 'contactUs', 'privacyPolicy', 'termsAndConditions');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PRAYER_TIME', 'LOCATION', 'CLOSED_MOSQUE', 'DUPLICATE', 'CONTACT_INFO', 'STAFF_INFO', 'DONATION_INFO', 'OTHER');

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "attachment" TEXT NOT NULL,
    "attachmentType" "AttachmentType" NOT NULL,
    "publicId" TEXT,
    "originalName" TEXT,
    "size" INTEGER,
    "mimeType" TEXT,
    "attachedToType" TEXT,
    "attachedToId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "profileImageUrl" TEXT NOT NULL DEFAULT '/uploads/users/user.png',
    "phoneNumber" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "authProvider" "UserAuthProvider" NOT NULL DEFAULT 'local',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecretEncrypted" TEXT,
    "twoFactorPendingEncrypted" TEXT,
    "twoFactorRecoveryCodeHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'web',
    "deviceName" TEXT,
    "deviceOsVersion" TEXT,
    "appVersion" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDevices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMosqueAttendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMosqueAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "source" "AuditSource" NOT NULL DEFAULT 'ADMIN_API',
    "previousValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MosqueStaff" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "MosqueStaffRole" NOT NULL,
    "name" TEXT NOT NULL,
    "contactNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MosqueRoleClaim" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MosqueStaffRole" NOT NULL,
    "evidence" TEXT NOT NULL,
    "status" "RoleClaimStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueRoleClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MosqueAnnouncement" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MosqueDonationMethod" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "methodType" "DonationMethodType" NOT NULL,
    "accountType" "DonationAccountType" NOT NULL DEFAULT 'MERCHANT',
    "accountNumber" TEXT NOT NULL,
    "accountTitle" TEXT,
    "bankName" TEXT,
    "branchName" TEXT,
    "routingNumber" TEXT,
    "instructions" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueDonationMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MosqueBookmark" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MosqueBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mosque" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "landmark" TEXT,
    "city" TEXT DEFAULT 'Dhaka',
    "country" TEXT NOT NULL DEFAULT 'Bangladesh',
    "operationalStatus" "MosqueOperationalStatus" NOT NULL DEFAULT 'OPEN',
    "verificationStatus" "MosqueVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasWuduArea" BOOLEAN NOT NULL DEFAULT true,
    "hasSeparateWomenSpace" BOOLEAN NOT NULL DEFAULT false,
    "hasAirConditioning" BOOLEAN NOT NULL DEFAULT false,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "hasWheelchairAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasJanazaFacility" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,

    CONSTRAINT "Mosque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerSchedule" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "fajrStart" TEXT,
    "fajrJamaat" TEXT,
    "sunrise" TEXT,
    "zuhrStart" TEXT,
    "zuhrJamaat" TEXT,
    "asrStart" TEXT,
    "asrJamaat" TEXT,
    "maghribStart" TEXT,
    "maghribJamaat" TEXT,
    "ishaStart" TEXT,
    "ishaJamaat" TEXT,
    "jumuahJamaat" TEXT,
    "jumuahSecondJamaat" TEXT,
    "taraweehJamaat" TEXT,
    "sahriEnd" TEXT,
    "iftarStart" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerScheduleHistory" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "scheduleSnapshot" JSONB NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrayerScheduleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "type" "SettingsType" NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MosqueSuggestion" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "userId" TEXT,
    "suggestedTimes" JSONB,
    "description" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MosqueReport" (
    "id" TEXT NOT NULL,
    "mosqueId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "contactEmail" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MosqueReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_attachedToType_attachedToId_isDeleted_idx" ON "Attachment"("attachedToType", "attachedToId", "isDeleted");

-- CreateIndex
CREATE INDEX "Attachment_attachmentType_isDeleted_idx" ON "Attachment"("attachmentType", "isDeleted");

-- CreateIndex
CREATE INDEX "Attachment_createdAt_isDeleted_idx" ON "Attachment"("createdAt", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_isDeleted_idx" ON "User"("email", "isDeleted");

-- CreateIndex
CREATE INDEX "User_role_isDeleted_idx" ON "User"("role", "isDeleted");

-- CreateIndex
CREATE INDEX "User_createdAt_isDeleted_idx" ON "User"("createdAt", "isDeleted");

-- CreateIndex
CREATE INDEX "UserDevices_userId_isDeleted_idx" ON "UserDevices"("userId", "isDeleted");

-- CreateIndex
CREATE INDEX "UserDevices_fcmToken_isDeleted_idx" ON "UserDevices"("fcmToken", "isDeleted");

-- CreateIndex
CREATE INDEX "UserDevices_deviceType_isDeleted_idx" ON "UserDevices"("deviceType", "isDeleted");

-- CreateIndex
CREATE INDEX "UserDevices_lastActive_isDeleted_idx" ON "UserDevices"("lastActive", "isDeleted");

-- CreateIndex
CREATE INDEX "UserMosqueAttendance_mosqueId_status_idx" ON "UserMosqueAttendance"("mosqueId", "status");

-- CreateIndex
CREATE INDEX "UserMosqueAttendance_userId_status_idx" ON "UserMosqueAttendance"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserMosqueAttendance_userId_mosqueId_key" ON "UserMosqueAttendance"("userId", "mosqueId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_source_createdAt_idx" ON "AuditLog"("source", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "MosqueStaff_mosqueId_role_idx" ON "MosqueStaff"("mosqueId", "role");

-- CreateIndex
CREATE INDEX "MosqueStaff_userId_idx" ON "MosqueStaff"("userId");

-- CreateIndex
CREATE INDEX "MosqueRoleClaim_mosqueId_status_idx" ON "MosqueRoleClaim"("mosqueId", "status");

-- CreateIndex
CREATE INDEX "MosqueRoleClaim_userId_idx" ON "MosqueRoleClaim"("userId");

-- CreateIndex
CREATE INDEX "MosqueAnnouncement_mosqueId_isPinned_createdAt_idx" ON "MosqueAnnouncement"("mosqueId", "isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "MosqueDonationMethod_mosqueId_isVerified_idx" ON "MosqueDonationMethod"("mosqueId", "isVerified");

-- CreateIndex
CREATE INDEX "MosqueBookmark_userId_idx" ON "MosqueBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MosqueBookmark_mosqueId_userId_key" ON "MosqueBookmark"("mosqueId", "userId");

-- CreateIndex
CREATE INDEX "Mosque_latitude_longitude_idx" ON "Mosque"("latitude", "longitude");

-- CreateIndex (PostGIS GiST spatial index for ST_DWithin and ST_Distance radial queries)
CREATE INDEX "Mosque_location_gist_idx" ON "Mosque" USING GIST (
    CAST(ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326) AS geography)
);

-- CreateIndex
CREATE INDEX "Mosque_verificationStatus_operationalStatus_isDeleted_idx" ON "Mosque"("verificationStatus", "operationalStatus", "isDeleted");

-- CreateIndex
CREATE INDEX "Mosque_name_isDeleted_idx" ON "Mosque"("name", "isDeleted");

-- CreateIndex
CREATE INDEX "Mosque_createdById_idx" ON "Mosque"("createdById");

-- CreateIndex
CREATE INDEX "Mosque_createdAt_idx" ON "Mosque"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrayerSchedule_mosqueId_key" ON "PrayerSchedule"("mosqueId");

-- CreateIndex
CREATE INDEX "PrayerSchedule_mosqueId_idx" ON "PrayerSchedule"("mosqueId");

-- CreateIndex
CREATE INDEX "PrayerSchedule_updatedAt_idx" ON "PrayerSchedule"("updatedAt");

-- CreateIndex
CREATE INDEX "PrayerScheduleHistory_mosqueId_createdAt_idx" ON "PrayerScheduleHistory"("mosqueId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_type_key" ON "Settings"("type");

-- CreateIndex
CREATE INDEX "Settings_type_idx" ON "Settings"("type");

-- CreateIndex
CREATE INDEX "MosqueSuggestion_mosqueId_status_idx" ON "MosqueSuggestion"("mosqueId", "status");

-- CreateIndex
CREATE INDEX "MosqueSuggestion_status_createdAt_idx" ON "MosqueSuggestion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MosqueReport_mosqueId_status_idx" ON "MosqueReport"("mosqueId", "status");

-- CreateIndex
CREATE INDEX "MosqueReport_type_status_idx" ON "MosqueReport"("type", "status");

-- CreateIndex
CREATE INDEX "MosqueReport_status_createdAt_idx" ON "MosqueReport"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "UserDevices" ADD CONSTRAINT "UserDevices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMosqueAttendance" ADD CONSTRAINT "UserMosqueAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMosqueAttendance" ADD CONSTRAINT "UserMosqueAttendance_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueStaff" ADD CONSTRAINT "MosqueStaff_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueStaff" ADD CONSTRAINT "MosqueStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueRoleClaim" ADD CONSTRAINT "MosqueRoleClaim_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueRoleClaim" ADD CONSTRAINT "MosqueRoleClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueAnnouncement" ADD CONSTRAINT "MosqueAnnouncement_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueAnnouncement" ADD CONSTRAINT "MosqueAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueDonationMethod" ADD CONSTRAINT "MosqueDonationMethod_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueBookmark" ADD CONSTRAINT "MosqueBookmark_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueBookmark" ADD CONSTRAINT "MosqueBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mosque" ADD CONSTRAINT "Mosque_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mosque" ADD CONSTRAINT "Mosque_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerSchedule" ADD CONSTRAINT "PrayerSchedule_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerSchedule" ADD CONSTRAINT "PrayerSchedule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerScheduleHistory" ADD CONSTRAINT "PrayerScheduleHistory_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerScheduleHistory" ADD CONSTRAINT "PrayerScheduleHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueSuggestion" ADD CONSTRAINT "MosqueSuggestion_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueSuggestion" ADD CONSTRAINT "MosqueSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueReport" ADD CONSTRAINT "MosqueReport_mosqueId_fkey" FOREIGN KEY ("mosqueId") REFERENCES "Mosque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MosqueReport" ADD CONSTRAINT "MosqueReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

