-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Appointment_guestClientId_idx" ON "Appointment"("guestClientId");


-- ---------------------------------------------------------------------------
-- Database-level guarantee against double booking.
--
-- The application checks availability before writing, but that is a check-then-act
-- and two concurrent requests can both pass it. This constraint makes overlapping
-- bookings for the same staff member impossible, whatever the application does.
--
-- A plain UNIQUE (staffId, dateTime) would only catch identical start times;
-- an exclusion constraint over the [dateTime, endTime) range catches partial
-- overlaps too (10:00-11:00 vs 10:30-11:30).
--
-- Cancelled / completed / no-show bookings are excluded: they no longer hold the slot.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap_per_staff"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tsrange("dateTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING_PAYMENT', 'PENDING', 'CONFIRMED'));
