-- Índices para la poda diaria (src/lib/jobs/purge.ts).
--
-- Ninguna de estas dos tablas se limpiaba nunca y las dos crecen con el uso: un
-- negocio con diez turnos por día produce unas mil notificaciones por mes, y una
-- fila de auditoría por cada acción del panel. El trabajo que las poda filtra
-- sólo por fecha, y los índices que había tienen `createdAt` como segunda
-- columna — o sea que ese barrido leería la tabla entera todos los días.

CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
