-- Retry bookkeeping for notifications.
--
-- A failed WhatsApp or email already leaves a row with status = 'FAILED', but
-- nothing ever looked at it again: the message was simply lost. These two
-- columns let the retry cron pick those rows up and stop after a few attempts
-- instead of hammering a permanently invalid phone number forever.

ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3);

-- Rows that already exist failed once by definition.
UPDATE "Notification" SET "attempts" = 1 WHERE "status" = 'FAILED' AND "attempts" = 0;

CREATE INDEX IF NOT EXISTS "Notification_status_attempts_idx"
  ON "Notification" ("status", "attempts");
