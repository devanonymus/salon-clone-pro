-- Idempotent baseline: existing installations were provisioned before Prisma
-- migration history. On those databases this migration records the baseline
-- without recreating any object; on a fresh database it creates the full schema.
DO $baseline$
BEGIN
IF to_regclass('app."Tenant"') IS NOT NULL THEN
    RETURN;
END IF;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateTable
CREATE TABLE "app"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."ClientGlobal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."ClientTenant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientGlobalId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Staff" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLLABORATORE',
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "monthlyCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productiveHours" DOUBLE PRECISION NOT NULL DEFAULT 140,
    "monthlyTarget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Appointment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientTenantId" TEXT NOT NULL,
    "staffId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Sale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientGlobalId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "idempotencyKey" TEXT,
    "requestHash" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "fiscalStatus" TEXT NOT NULL DEFAULT 'NOT_ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'service',
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "technicalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "staffId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."FiscalReceipt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DEMO_PRINTED',
    "provider" TEXT NOT NULL DEFAULT 'DEMO',
    "payload" JSONB,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."InventoryProduct" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "productType" TEXT NOT NULL DEFAULT 'INTERNAL',
    "unit" TEXT NOT NULL DEFAULT 'pz',
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."ServiceRecipeItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL DEFAULT 'Shampoo',
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ServiceRecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."InventoryMovement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "saleId" TEXT,
    "reason" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "quantityBefore" DOUBLE PRECISION NOT NULL,
    "quantityChange" DOUBLE PRECISION NOT NULL,
    "quantityAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."TenantWhatsappConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "businessAccountId" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "apiVersion" TEXT NOT NULL DEFAULT 'v21.0',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantWhatsappConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."WhatsappConversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "lastMessage" TEXT,
    "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."WhatsappMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."ClientAward" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."ServicePrice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Altro',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."MarketingCard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 4,
    "sessions" JSONB,
    "increaseTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."MarketingCardTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "salonName" TEXT NOT NULL DEFAULT 'Acquaviva Strategic',
    "templateStyle" TEXT NOT NULL DEFAULT 'LUXURY_GOLD',
    "primaryColor" TEXT NOT NULL DEFAULT '#080808',
    "accentColor" TEXT NOT NULL DEFAULT '#d4af37',
    "title" TEXT NOT NULL DEFAULT 'Il tuo percorso bellezza personalizzato',
    "subtitle" TEXT NOT NULL DEFAULT 'Una card pensata per mantenere il risultato nel tempo.',
    "promiseText" TEXT NOT NULL DEFAULT 'Non è una semplice promozione: è un percorso guidato per farti restare sempre in ordine, senza improvvisare.',
    "valueText" TEXT NOT NULL DEFAULT 'Abbiamo racchiuso servizi, prodotti e bonus in una proposta chiara, comoda e ad alto valore.',
    "bonusText" TEXT NOT NULL DEFAULT 'I bonus inclusi sono pensati per aumentare il risultato e farti vivere un’esperienza più completa.',
    "urgencyText" TEXT NOT NULL DEFAULT 'I posti disponibili per questo percorso sono limitati per garantire continuità e qualità.',
    "guaranteeText" TEXT NOT NULL DEFAULT 'Ti guideremo passo dopo passo nella scelta più adatta ai tuoi capelli.',
    "ctaText" TEXT NOT NULL DEFAULT 'Blocca oggi il tuo percorso e programma subito le sedute.',
    "footerText" TEXT NOT NULL DEFAULT 'Card personale, non convertibile in denaro.',
    "signature" TEXT NOT NULL DEFAULT 'Il tuo salone di fiducia',
    "promoMessageTemplate" TEXT NOT NULL DEFAULT 'Ciao {nome_cliente} 💛

Abbiamo preparato una proposta speciale pensata per mantenere il risultato nel tempo:
*{nome_card}*

Prezzo card: € {prezzo_card}
Sedute incluse: {sedute}
Prezzo medio per seduta: € {prezzo_seduta}

Vuoi che ti blocchiamo questa possibilità?

{firma}',
    "confirmMessageTemplate" TEXT NOT NULL DEFAULT 'Ciao {nome_cliente} 💛

Ti confermiamo la tua card:
*{nome_card}*

Prezzo card: € {prezzo_card}
Sedute incluse: {sedute}
Prezzo medio per seduta: € {prezzo_seduta}

Ti aspettiamo in salone.

{firma}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."MarketingCardSale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientTenantId" TEXT,
    "clientName" TEXT NOT NULL,
    "whatsapp" TEXT,
    "cardName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 1,
    "sessions" JSONB,
    "appointments" JSONB,
    "paymentMode" TEXT NOT NULL DEFAULT 'RATE_SEDUTE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCardSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."MarketingCardPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "marketingCardSaleId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentType" TEXT NOT NULL DEFAULT 'RATA_SEDUTA',
    "method" TEXT NOT NULL DEFAULT 'CONTANTI',
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingCardPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."CoachSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vatServicesPercent" DOUBLE PRECISION NOT NULL DEFAULT 22,
    "vatResalePercent" DOUBLE PRECISION NOT NULL DEFAULT 22,
    "posFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "posFixedFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variableOverheadPercent" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "taxReservePercent" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "productiveHoursMonth" DOUBLE PRECISION NOT NULL DEFAULT 140,
    "agendaGridMinutes" INTEGER NOT NULL DEFAULT 5,
    "cardGiftKitInCost" BOOLEAN NOT NULL DEFAULT false,
    "allowedDomains" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."CoachFixedCost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachFixedCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."CoachPrebookingResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "serviceName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NON_PROPOSTO',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPrebookingResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "app"."Tenant"("code");

-- CreateIndex
CREATE INDEX "User_tenant_active_idx" ON "app"."User"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_username_key" ON "app"."User"("tenantId", "username");

-- CreateIndex
CREATE INDEX "Client_tenant_created_idx" ON "app"."Client"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientGlobal_phone_key" ON "app"."ClientGlobal"("phone");

-- CreateIndex
CREATE INDEX "ClientTenant_tenant_archived_created_idx" ON "app"."ClientTenant"("tenantId", "archived", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientTenant_tenantId_clientGlobalId_key" ON "app"."ClientTenant"("tenantId", "clientGlobalId");

-- CreateIndex
CREATE INDEX "Staff_tenant_active_idx" ON "app"."Staff"("tenantId", "active");

-- CreateIndex
CREATE INDEX "Appointment_tenant_date_idx" ON "app"."Appointment"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Appointment_tenant_staff_date_idx" ON "app"."Appointment"("tenantId", "staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_appointmentId_key" ON "app"."Sale"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_idempotency_key" ON "app"."Sale"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Sale_tenant_created_idx" ON "app"."Sale"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "SaleItem_sale_type_idx" ON "app"."SaleItem"("saleId", "type");

-- CreateIndex
CREATE INDEX "FiscalReceipt_tenant_created_idx" ON "app"."FiscalReceipt"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "FiscalReceipt_sale_idx" ON "app"."FiscalReceipt"("saleId");

-- CreateIndex
CREATE INDEX "InventoryProduct_tenant_active_idx" ON "app"."InventoryProduct"("tenantId", "active");

-- CreateIndex
CREATE INDEX "InventoryProduct_tenant_type_category_idx" ON "app"."InventoryProduct"("tenantId", "productType", "category");

-- CreateIndex
CREATE INDEX "ServiceRecipeItem_tenant_service_idx" ON "app"."ServiceRecipeItem"("tenantId", "serviceName");

-- CreateIndex
CREATE INDEX "InventoryMovement_tenant_created_idx" ON "app"."InventoryMovement"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_product_created_idx" ON "app"."InventoryMovement"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TenantWhatsappConfig_tenantId_key" ON "app"."TenantWhatsappConfig"("tenantId");

-- CreateIndex
CREATE INDEX "WhatsappConversation_tenant_last_idx" ON "app"."WhatsappConversation"("tenantId", "lastAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConversation_tenantId_phone_key" ON "app"."WhatsappConversation"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMessage_providerId_key" ON "app"."WhatsappMessage"("providerId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_conversation_created_idx" ON "app"."WhatsappMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientAward_tenant_client_created_idx" ON "app"."ClientAward"("tenantId", "clientGlobalId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientAward_tenant_status_expiry_idx" ON "app"."ClientAward"("tenantId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "ServicePrice_tenant_active_category_idx" ON "app"."ServicePrice"("tenantId", "active", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrice_tenantId_name_key" ON "app"."ServicePrice"("tenantId", "name");

-- CreateIndex
CREATE INDEX "MarketingCard_tenant_active_idx" ON "app"."MarketingCard"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingCard_tenantId_name_key" ON "app"."MarketingCard"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingCardTemplate_tenantId_key" ON "app"."MarketingCardTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "MarketingCardSale_tenant_active_created_idx" ON "app"."MarketingCardSale"("tenantId", "active", "createdAt");

-- CreateIndex
CREATE INDEX "MarketingCardPayment_sale_paid_idx" ON "app"."MarketingCardPayment"("marketingCardSaleId", "paidAt");

-- CreateIndex
CREATE INDEX "MarketingCardPayment_tenant_paid_idx" ON "app"."MarketingCardPayment"("tenantId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachSettings_tenantId_key" ON "app"."CoachSettings"("tenantId");

-- CreateIndex
CREATE INDEX "CoachFixedCost_tenant_active_idx" ON "app"."CoachFixedCost"("tenantId", "active");

-- CreateIndex
CREATE INDEX "CoachPrebooking_tenant_date_updated_idx" ON "app"."CoachPrebookingResult"("tenantId", "dateKey", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachPrebookingResult_tenantId_appointmentId_key" ON "app"."CoachPrebookingResult"("tenantId", "appointmentId");

-- AddForeignKey
ALTER TABLE "app"."User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClientTenant" ADD CONSTRAINT "ClientTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClientTenant" ADD CONSTRAINT "ClientTenant_clientGlobalId_fkey" FOREIGN KEY ("clientGlobalId") REFERENCES "app"."ClientGlobal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Staff" ADD CONSTRAINT "Staff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Appointment" ADD CONSTRAINT "Appointment_clientTenantId_fkey" FOREIGN KEY ("clientTenantId") REFERENCES "app"."ClientTenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Appointment" ADD CONSTRAINT "Appointment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "app"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Sale" ADD CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Sale" ADD CONSTRAINT "Sale_clientGlobalId_fkey" FOREIGN KEY ("clientGlobalId") REFERENCES "app"."ClientGlobal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Sale" ADD CONSTRAINT "Sale_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "app"."Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "app"."Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."FiscalReceipt" ADD CONSTRAINT "FiscalReceipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."FiscalReceipt" ADD CONSTRAINT "FiscalReceipt_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "app"."Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."InventoryProduct" ADD CONSTRAINT "InventoryProduct_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ServiceRecipeItem" ADD CONSTRAINT "ServiceRecipeItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ServiceRecipeItem" ADD CONSTRAINT "ServiceRecipeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "app"."InventoryProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "app"."InventoryProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "app"."Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."TenantWhatsappConfig" ADD CONSTRAINT "TenantWhatsappConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "app"."WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClientAward" ADD CONSTRAINT "ClientAward_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClientAward" ADD CONSTRAINT "ClientAward_clientGlobalId_fkey" FOREIGN KEY ("clientGlobalId") REFERENCES "app"."ClientGlobal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClientAward" ADD CONSTRAINT "ClientAward_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "app"."Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ServicePrice" ADD CONSTRAINT "ServicePrice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."MarketingCard" ADD CONSTRAINT "MarketingCard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."MarketingCardTemplate" ADD CONSTRAINT "MarketingCardTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."MarketingCardSale" ADD CONSTRAINT "MarketingCardSale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."MarketingCardPayment" ADD CONSTRAINT "MarketingCardPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."MarketingCardPayment" ADD CONSTRAINT "MarketingCardPayment_marketingCardSaleId_fkey" FOREIGN KEY ("marketingCardSaleId") REFERENCES "app"."MarketingCardSale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."CoachSettings" ADD CONSTRAINT "CoachSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."CoachFixedCost" ADD CONSTRAINT "CoachFixedCost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."CoachPrebookingResult" ADD CONSTRAINT "CoachPrebookingResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "app"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

END
$baseline$;
