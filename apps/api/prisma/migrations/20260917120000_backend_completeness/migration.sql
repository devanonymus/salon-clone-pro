-- Complete features that were referenced by the frontend but absent from the
-- versioned backend. Every operation is additive and safe on restored databases.

CREATE TABLE IF NOT EXISTS "app"."ClientAward" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientGlobalId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "prizeName" TEXT NOT NULL,
    "prizeType" TEXT NOT NULL DEFAULT 'WHEEL_PRIZE',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'WHEEL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientAward_pkey" PRIMARY KEY ("id")
);

ALTER TABLE IF EXISTS "app"."ClientAward"
    ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
    ADD COLUMN IF NOT EXISTS "clientGlobalId" TEXT,
    ADD COLUMN IF NOT EXISTS "appointmentId" TEXT,
    ADD COLUMN IF NOT EXISTS "prizeName" TEXT,
    ADD COLUMN IF NOT EXISTS "prizeType" TEXT NOT NULL DEFAULT 'WHEEL_PRIZE',
    ADD COLUMN IF NOT EXISTS "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'WHEEL',
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "notes" TEXT,
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "ClientAward_tenant_client_created_idx"
    ON "app"."ClientAward" ("tenantId", "clientGlobalId", "createdAt");
CREATE INDEX IF NOT EXISTS "ClientAward_tenant_status_expiry_idx"
    ON "app"."ClientAward" ("tenantId", "status", "expiresAt");

DO $constraints$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClientAward_tenantId_fkey'
    ) THEN
        ALTER TABLE "app"."ClientAward"
            ADD CONSTRAINT "ClientAward_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClientAward_clientGlobalId_fkey'
    ) THEN
        ALTER TABLE "app"."ClientAward"
            ADD CONSTRAINT "ClientAward_clientGlobalId_fkey"
            FOREIGN KEY ("clientGlobalId") REFERENCES "app"."ClientGlobal"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClientAward_appointmentId_fkey'
    ) THEN
        ALTER TABLE "app"."ClientAward"
            ADD CONSTRAINT "ClientAward_appointmentId_fkey"
            FOREIGN KEY ("appointmentId") REFERENCES "app"."Appointment"("id")
            ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
    END IF;
END
$constraints$;

-- Preserve every message while removing only repeated external identifiers.
WITH duplicates AS (
    SELECT "id",
           row_number() OVER (PARTITION BY "providerId" ORDER BY "createdAt", "id") AS position
    FROM "app"."WhatsappMessage"
    WHERE "providerId" IS NOT NULL
)
UPDATE "app"."WhatsappMessage" AS message
SET "providerId" = NULL
FROM duplicates
WHERE message."id" = duplicates."id" AND duplicates.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsappMessage_providerId_key"
    ON "app"."WhatsappMessage" ("providerId");
