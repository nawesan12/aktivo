-- Free trial window. After it, without an active subscription, the panel goes
-- read-only.
ALTER TABLE "Business" ADD COLUMN "trialEndsAt" TIMESTAMP(3);

-- Businesses that already exist get a fresh week rather than being locked out
-- the moment this is applied: they never agreed to a trial that already ran.
UPDATE "Business"
   SET "trialEndsAt" = now() + interval '7 days'
 WHERE "plan" = 'STARTER';
