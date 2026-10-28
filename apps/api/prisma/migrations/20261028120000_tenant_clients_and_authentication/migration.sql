-- Separate client identities by salon without deleting historical records.
-- Run only after a verified backup and rehearsal. All changes are atomic.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';
LOCK TABLE "app"."ClientGlobal", "app"."ClientTenant", "app"."Sale", "app"."ClientAward"
  IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE "app"."User"
  ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "loginFailedAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "loginLockedUntil" TIMESTAMP(3);

ALTER TABLE "app"."ClientGlobal" ADD COLUMN "ownerTenantId" TEXT;

CREATE TEMPORARY TABLE "_salonpro_client_scope" ON COMMIT DROP AS
WITH scopes AS (
  SELECT "clientGlobalId", "tenantId" FROM "app"."ClientTenant"
  UNION
  SELECT "clientGlobalId", "tenantId" FROM "app"."Sale"
  UNION
  SELECT "clientGlobalId", "tenantId" FROM "app"."ClientAward"
), ranked AS (
  SELECT *, row_number() OVER (PARTITION BY "clientGlobalId" ORDER BY "tenantId") AS ordinal
  FROM scopes
)
SELECT "clientGlobalId", "tenantId",
  CASE WHEN ordinal = 1 THEN "clientGlobalId" ELSE gen_random_uuid()::text END AS "scopedId"
FROM ranked;

-- Remove the old uniqueness rule before making independent copies.
DROP INDEX "app"."ClientGlobal_phone_key";

UPDATE "app"."ClientGlobal" c SET "ownerTenantId" = m."tenantId"
FROM "_salonpro_client_scope" m
WHERE m."clientGlobalId" = c.id AND m."scopedId" = c.id;

INSERT INTO "app"."ClientGlobal" (id, name, phone, email, "createdAt", "ownerTenantId")
SELECT m."scopedId", c.name, c.phone, c.email, c."createdAt", m."tenantId"
FROM "_salonpro_client_scope" m
JOIN "app"."ClientGlobal" c ON c.id = m."clientGlobalId"
WHERE m."scopedId" <> m."clientGlobalId";

UPDATE "app"."ClientTenant" t SET "clientGlobalId" = m."scopedId"
FROM "_salonpro_client_scope" m
WHERE t."clientGlobalId" = m."clientGlobalId" AND t."tenantId" = m."tenantId";
UPDATE "app"."Sale" t SET "clientGlobalId" = m."scopedId"
FROM "_salonpro_client_scope" m
WHERE t."clientGlobalId" = m."clientGlobalId" AND t."tenantId" = m."tenantId";
UPDATE "app"."ClientAward" t SET "clientGlobalId" = m."scopedId"
FROM "_salonpro_client_scope" m
WHERE t."clientGlobalId" = m."clientGlobalId" AND t."tenantId" = m."tenantId";

CREATE UNIQUE INDEX "ClientGlobal_ownerTenantId_phone_key" ON "app"."ClientGlobal" ("ownerTenantId", phone);
CREATE UNIQUE INDEX "ClientGlobal_id_ownerTenantId_key" ON "app"."ClientGlobal" (id, "ownerTenantId");
ALTER TABLE "app"."ClientGlobal" ADD CONSTRAINT "ClientGlobal_ownerTenantId_fkey"
  FOREIGN KEY ("ownerTenantId") REFERENCES "app"."Tenant"(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "app"."ClientTenant" DROP CONSTRAINT "ClientTenant_clientGlobalId_fkey";
ALTER TABLE "app"."ClientTenant" ADD CONSTRAINT "ClientTenant_clientGlobalId_tenantId_fkey"
  FOREIGN KEY ("clientGlobalId", "tenantId") REFERENCES "app"."ClientGlobal"(id, "ownerTenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."Sale" DROP CONSTRAINT "Sale_clientGlobalId_fkey";
ALTER TABLE "app"."Sale" ADD CONSTRAINT "Sale_clientGlobalId_tenantId_fkey"
  FOREIGN KEY ("clientGlobalId", "tenantId") REFERENCES "app"."ClientGlobal"(id, "ownerTenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "app"."ClientAward" DROP CONSTRAINT "ClientAward_clientGlobalId_fkey";
ALTER TABLE "app"."ClientAward" ADD CONSTRAINT "ClientAward_clientGlobalId_tenantId_fkey"
  FOREIGN KEY ("clientGlobalId", "tenantId") REFERENCES "app"."ClientGlobal"(id, "ownerTenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;
