-- Public acquisition leads for demo requests and Salon Score completions.
CREATE TABLE "app"."Lead" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "salon" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "teamSize" TEXT,
    "currentManagement" TEXT,
    "answers" JSONB,
    "score" INTEGER,
    "categoryScores" JSONB,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "referrer" TEXT,
    "privacyAccepted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lead_source_check" CHECK ("source" IN ('demo', 'salon_score')),
    CONSTRAINT "Lead_stage_check" CHECK ("stage" IN (
        'NEW',
        'CONTACTED',
        'QUALIFIED',
        'DEMO_BOOKED',
        'DEMO_DONE',
        'TRIAL',
        'CUSTOMER',
        'LOST'
    )),
    CONSTRAINT "Lead_score_check" CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100))
);

CREATE INDEX "Lead_source_stage_created_idx"
ON "app"."Lead"("source", "stage", "createdAt");

CREATE INDEX "Lead_email_created_idx"
ON "app"."Lead"("email", "createdAt");

CREATE INDEX "Lead_phone_created_idx"
ON "app"."Lead"("phone", "createdAt");
