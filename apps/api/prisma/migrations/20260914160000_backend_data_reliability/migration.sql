-- Additive reliability migration for databases already provisioned with schema app.
-- Apply with prisma migrate deploy after taking a PostgreSQL backup.

ALTER TABLE IF EXISTS "app"."Sale"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "requestHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Sale_tenant_idempotency_key"
  ON "app"."Sale" ("tenantId", "idempotencyKey");

CREATE INDEX IF NOT EXISTS "User_tenant_active_idx"
  ON "app"."User" ("tenantId", "active");
CREATE INDEX IF NOT EXISTS "Client_tenant_created_idx"
  ON "app"."Client" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "ClientTenant_tenant_archived_created_idx"
  ON "app"."ClientTenant" ("tenantId", "archived", "createdAt");
CREATE INDEX IF NOT EXISTS "Staff_tenant_active_idx"
  ON "app"."Staff" ("tenantId", "active");
CREATE INDEX IF NOT EXISTS "Appointment_tenant_date_idx"
  ON "app"."Appointment" ("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Appointment_tenant_staff_date_idx"
  ON "app"."Appointment" ("tenantId", "staffId", "date");
CREATE INDEX IF NOT EXISTS "Sale_tenant_created_idx"
  ON "app"."Sale" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "SaleItem_sale_type_idx"
  ON "app"."SaleItem" ("saleId", "type");
CREATE INDEX IF NOT EXISTS "FiscalReceipt_tenant_created_idx"
  ON "app"."FiscalReceipt" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "FiscalReceipt_sale_idx"
  ON "app"."FiscalReceipt" ("saleId");
CREATE INDEX IF NOT EXISTS "InventoryProduct_tenant_active_idx"
  ON "app"."InventoryProduct" ("tenantId", "active");
CREATE INDEX IF NOT EXISTS "InventoryProduct_tenant_type_category_idx"
  ON "app"."InventoryProduct" ("tenantId", "productType", "category");
CREATE INDEX IF NOT EXISTS "ServiceRecipeItem_tenant_service_idx"
  ON "app"."ServiceRecipeItem" ("tenantId", "serviceName");
CREATE INDEX IF NOT EXISTS "InventoryMovement_tenant_created_idx"
  ON "app"."InventoryMovement" ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryMovement_product_created_idx"
  ON "app"."InventoryMovement" ("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "WhatsappConversation_tenant_last_idx"
  ON "app"."WhatsappConversation" ("tenantId", "lastAt");
CREATE INDEX IF NOT EXISTS "WhatsappMessage_conversation_created_idx"
  ON "app"."WhatsappMessage" ("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "ServicePrice_tenant_active_category_idx"
  ON "app"."ServicePrice" ("tenantId", "active", "category");
CREATE INDEX IF NOT EXISTS "MarketingCard_tenant_active_idx"
  ON "app"."MarketingCard" ("tenantId", "active");
CREATE INDEX IF NOT EXISTS "MarketingCardSale_tenant_active_created_idx"
  ON "app"."MarketingCardSale" ("tenantId", "active", "createdAt");
CREATE INDEX IF NOT EXISTS "MarketingCardPayment_sale_paid_idx"
  ON "app"."MarketingCardPayment" ("marketingCardSaleId", "paidAt");
CREATE INDEX IF NOT EXISTS "MarketingCardPayment_tenant_paid_idx"
  ON "app"."MarketingCardPayment" ("tenantId", "paidAt");
CREATE INDEX IF NOT EXISTS "CoachFixedCost_tenant_active_idx"
  ON "app"."CoachFixedCost" ("tenantId", "active");
CREATE INDEX IF NOT EXISTS "CoachPrebooking_tenant_date_updated_idx"
  ON "app"."CoachPrebookingResult" ("tenantId", "dateKey", "updatedAt");
