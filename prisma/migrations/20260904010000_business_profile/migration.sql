-- The rest of what a business shows on its public page: a longer "about", its
-- social accounts, coordinates for a map, and a photo gallery.
ALTER TABLE "Business" ADD COLUMN "about" TEXT;
ALTER TABLE "Business" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Business" ADD COLUMN "facebook" TEXT;
ALTER TABLE "Business" ADD COLUMN "tiktok" TEXT;
ALTER TABLE "Business" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Business" ADD COLUMN "longitude" DOUBLE PRECISION;

-- One cover image cannot show a shop, its chairs and a couple of haircuts.
CREATE TABLE "BusinessPhoto" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessPhoto_businessId_sortOrder_idx" ON "BusinessPhoto"("businessId", "sortOrder");

ALTER TABLE "BusinessPhoto"
  ADD CONSTRAINT "BusinessPhoto_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
