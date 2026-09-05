-- El contador de la campanita no bajaba nunca al abrirla.
--
-- No era que faltara marcar como leídas: `Notification` no tiene ningún campo
-- de leído, y el número era un conteo de los correos enviados en las últimas 24
-- horas. O sea que bajaba solo con el paso del tiempo, no cuando alguien miraba.
--
-- Una marca por negocio en vez de un campo por notificación: con miles de filas
-- al mes, marcarlas una por una sería una escritura por cada correo enviado.

ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "notificationsSeenAt" TIMESTAMP(3);
