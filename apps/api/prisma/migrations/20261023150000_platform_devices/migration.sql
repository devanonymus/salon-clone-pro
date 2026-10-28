-- CreateEnum
CREATE TYPE "app"."PhysicalCheckResult" AS ENUM ('PENDING', 'PASS', 'FAIL');

-- CreateTable
CREATE TABLE "app"."PlatformDevice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "secretsEncrypted" TEXT,
    "legacyConfigurationId" TEXT,
    "dueDate" DATE,
    "physicalCheck" "app"."PhysicalCheckResult" NOT NULL DEFAULT 'PENDING',
    "checkedAt" TIMESTAMP(3),
    "checkedBy" TEXT,
    "checkNotes" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformDevice_legacyConfigurationId_key" ON "app"."PlatformDevice"("legacyConfigurationId");

-- CreateIndex
CREATE INDEX "PlatformDevice_tenantId_archivedAt_dueDate_idx" ON "app"."PlatformDevice"("tenantId", "archivedAt", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformDevice_tenantId_section_label_key" ON "app"."PlatformDevice"("tenantId", "section", "label");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformDevice_tenantId_section_identity_key" ON "app"."PlatformDevice"("tenantId", "section", "identity");

-- AddForeignKey
ALTER TABLE "app"."PlatformDevice" ADD CONSTRAINT "PlatformDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."PlatformDevice" ADD CONSTRAINT "PlatformDevice_legacyConfigurationId_fkey" FOREIGN KEY ("legacyConfigurationId") REFERENCES "app"."PlatformConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
