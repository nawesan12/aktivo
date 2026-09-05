-- "Tus turnos de mañana": el resumen diario al negocio.
--
-- Hasta acá, la única notificación que salía por una reserva era la del
-- cliente. El dueño se enteraba si abría el panel: un turno tomado a las once
-- de la noche esperaba hasta que alguien mirara.
--
-- Aditivo: dos columnas con default.

ALTER TABLE "BusinessSettings"
  ADD COLUMN IF NOT EXISTS "dailyDigestEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "BusinessSettings"
  ADD COLUMN IF NOT EXISTS "dailyDigestSentFor" TIMESTAMP(3);
