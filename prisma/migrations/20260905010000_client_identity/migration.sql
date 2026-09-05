-- El cliente final pasa a tener una sola identidad, y su llave es el email.
--
-- Hasta acá un cliente podía buscar sus turnos sólo por teléfono y sólo dentro
-- de un negocio. El teléfono nunca sirvió para eso: `GuestClient.phone` está
-- scopeado a un local, y quien reservó con sesión iniciada jamás dio uno. El
-- email sí es el mismo en todos lados, y ya era el único canal por el que viaja
-- el código de verificación.
--
-- Todo aditivo: dos índices y una columna nueva. La única alteración es aflojar
-- el NOT NULL de "GuestVerification"."phone", que ya no se escribe.

CREATE INDEX IF NOT EXISTS "GuestClient_email_idx" ON "GuestClient"("email");

ALTER TABLE "GuestVerification" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "GuestVerification" ADD COLUMN IF NOT EXISTS "email" TEXT;

CREATE INDEX IF NOT EXISTS "GuestVerification_email_expiresAt_idx"
  ON "GuestVerification"("email", "expiresAt");

-- Un cliente cargado a mano desde el panel puede no dejar teléfono, y hasta acá
-- eso se guardaba como "". Con el unique (businessId, phone) sólo entraba uno
-- por negocio: el segundo rompía con una violación de constraint. En Postgres
-- dos NULL no son iguales, así que el hueco desaparece.
ALTER TABLE "GuestClient" ALTER COLUMN "phone" DROP NOT NULL;
UPDATE "GuestClient" SET "phone" = NULL WHERE "phone" = '';
