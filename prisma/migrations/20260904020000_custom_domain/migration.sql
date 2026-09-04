-- A business's own domain: mibarberia.com pointing at its page.
CREATE TYPE "DomainStatus" AS ENUM ('NONE', 'PENDING', 'ACTIVE', 'ERROR');

ALTER TABLE "Business"
  ADD COLUMN "customDomain" TEXT,
  ADD COLUMN "customDomainStatus" "DomainStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "customDomainAddedAt" TIMESTAMP(3);

-- A host resolves to exactly one business, and the resolution runs on every
-- request that arrives on that host.
CREATE UNIQUE INDEX "Business_customDomain_key" ON "Business"("customDomain");
