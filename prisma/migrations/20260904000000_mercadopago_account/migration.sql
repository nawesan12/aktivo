-- A business's own MercadoPago account, linked through OAuth.
--
-- Replaces pasting an access token into a form. `expiresAt` is indexed so the
-- renewal job can ask which links are about to lapse; `mpUserId` is unique
-- because it is what an incoming webhook matches on to find its business.
CREATE TABLE "MercadoPagoAccount" (
    "businessId" TEXT NOT NULL,
    "mpUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "publicKey" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastRefreshAt" TIMESTAMP(3),
    "lastError" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MercadoPagoAccount_pkey" PRIMARY KEY ("businessId")
);

CREATE UNIQUE INDEX "MercadoPagoAccount_mpUserId_key" ON "MercadoPagoAccount"("mpUserId");
CREATE INDEX "MercadoPagoAccount_expiresAt_idx" ON "MercadoPagoAccount"("expiresAt");

ALTER TABLE "MercadoPagoAccount"
  ADD CONSTRAINT "MercadoPagoAccount_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The renewal job needs its throttle row like every other job.
INSERT INTO "JobRun" ("name", "lastRunAt")
VALUES ('mercadopago-renewal', '1970-01-01T00:00:00.000Z')
ON CONFLICT ("name") DO NOTHING;
