-- One category name per business.
--
-- Nothing stopped a business from having two categories called "Barba", and
-- re-running the seed created exactly that. Duplicates are merged into the
-- oldest row before the constraint goes on, so no service loses its category.

UPDATE "Service" s
SET "categoryId" = keep.id
FROM "ServiceCategory" dup
JOIN LATERAL (
  SELECT c.id
  FROM "ServiceCategory" c
  WHERE c."businessId" = dup."businessId" AND c."name" = dup."name"
  ORDER BY c."createdAt" ASC, c.id ASC
  LIMIT 1
) keep ON TRUE
WHERE s."categoryId" = dup.id AND dup.id <> keep.id;

DELETE FROM "ServiceCategory" c
USING "ServiceCategory" keep
WHERE c."businessId" = keep."businessId"
  AND c."name" = keep."name"
  AND (keep."createdAt", keep.id) < (c."createdAt", c.id);

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceCategory_businessId_name_key"
  ON "ServiceCategory" ("businessId", "name");
