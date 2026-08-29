-- Lets verifyCode() count failed attempts and burn a code after too many,
-- so a 6-digit code can't be brute-forced within its 10-minute window.
ALTER TABLE "GuestVerification" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- verifyCode() now looks codes up by phone + expiry (not phone + code).
CREATE INDEX "GuestVerification_phone_expiresAt_idx" ON "GuestVerification"("phone", "expiresAt");
