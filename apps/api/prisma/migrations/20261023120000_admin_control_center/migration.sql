-- CreateEnum
CREATE TYPE "app"."PlatformRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "app"."SalonStatus" AS ENUM ('BOZZA', 'IN_CONFIGURAZIONE', 'DA_COLLAUDARE', 'ATTIVO', 'SOSPESO');

-- CreateTable
CREATE TABLE "app"."PlatformAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "app"."PlatformRole" NOT NULL DEFAULT 'TECHNICIAN',
    "passwordHash" TEXT,
    "totpEncrypted" TEXT,
    "lastTotpStep" BIGINT NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."PlatformSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."SalonProfile" (
    "tenantId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "taxCode" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "plan" TEXT,
    "status" "app"."SalonStatus" NOT NULL DEFAULT 'BOZZA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonProfile_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "app"."TechnicianAssignment" (
    "adminId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicianAssignment_pkey" PRIMARY KEY ("adminId","tenantId")
);

-- CreateTable
CREATE TABLE "app"."PlatformConfiguration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "secretsEncrypted" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."SalonOnboarding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT NOT NULL DEFAULT '',
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3),

    CONSTRAINT "SalonOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."TechnicalIntervention" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."PlatformAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "tenantId" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."PlatformInvitation" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "adminId" TEXT,
    "tenantId" TEXT,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."PlatformMailOutbox" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "payloadEncrypted" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "app"."PlatformAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSession_tokenHash_key" ON "app"."PlatformSession"("tokenHash");

-- CreateIndex
CREATE INDEX "PlatformSession_adminId_expiresAt_idx" ON "app"."PlatformSession"("adminId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalonProfile_vatNumber_key" ON "app"."SalonProfile"("vatNumber");

-- CreateIndex
CREATE INDEX "SalonProfile_status_city_idx" ON "app"."SalonProfile"("status", "city");

-- CreateIndex
CREATE INDEX "TechnicianAssignment_tenantId_idx" ON "app"."TechnicianAssignment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConfiguration_tenantId_section_key" ON "app"."PlatformConfiguration"("tenantId", "section");

-- CreateIndex
CREATE UNIQUE INDEX "SalonOnboarding_tenantId_key_key" ON "app"."SalonOnboarding"("tenantId", "key");

-- CreateIndex
CREATE INDEX "TechnicalIntervention_tenantId_createdAt_idx" ON "app"."TechnicalIntervention"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_createdAt_idx" ON "app"."PlatformAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformInvitation_tokenHash_key" ON "app"."PlatformInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "PlatformMailOutbox_sentAt_createdAt_idx" ON "app"."PlatformMailOutbox"("sentAt", "createdAt");

-- AddForeignKey
ALTER TABLE "app"."PlatformSession" ADD CONSTRAINT "PlatformSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "app"."PlatformAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."SalonProfile" ADD CONSTRAINT "SalonProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."TechnicianAssignment" ADD CONSTRAINT "TechnicianAssignment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "app"."PlatformAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."TechnicianAssignment" ADD CONSTRAINT "TechnicianAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."PlatformConfiguration" ADD CONSTRAINT "PlatformConfiguration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."SalonOnboarding" ADD CONSTRAINT "SalonOnboarding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."TechnicalIntervention" ADD CONSTRAINT "TechnicalIntervention_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."PlatformInvitation" ADD CONSTRAINT "PlatformInvitation_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "app"."PlatformAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."PlatformInvitation" ADD CONSTRAINT "PlatformInvitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
