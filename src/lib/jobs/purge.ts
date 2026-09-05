import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("purge");

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Cuánto se guarda cada cosa.
 *
 * Ninguna de estas tablas se podaba, y las tres crecen con el uso: un negocio
 * con diez turnos por día genera unas mil notificaciones por mes —confirmación,
 * dos recordatorios y el pedido de reseña por turno— y una fila de auditoría por
 * cada cosa que toca en el panel. Con veinte negocios eso son cientos de miles
 * de filas al año, en una base que se paga por almacenamiento y por cómputo, y
 * ninguna de ellas se vuelve a leer después de la primera semana.
 */
const RETENCION = {
  /** El registro de envíos. La campanita muestra 7 días; el log filtra por fecha. */
  notificaciones: 60,
  /** Auditoría: más larga a propósito, es lo que se mira cuando algo no cierra. */
  auditoria: 180,
  /** Códigos de acceso: nacen con diez minutos de vida. */
  verificaciones: 1,
} as const;

/** Por pasada y por tabla, para no bloquear con un `DELETE` gigante. */
const BATCH_SIZE = 5_000;

export interface PurgeResult {
  notificaciones: number;
  auditoria: number;
  verificaciones: number;
}

/**
 * Tira lo que ya nadie va a leer.
 *
 * Corre una vez por día. `deleteMany` con un `where` sobre `createdAt` usa el
 * índice y no recorre la tabla entera; el tope por pasada existe para que la
 * primera corrida sobre una base que nunca se limpió no se coma la conexión.
 */
export async function purgeOldRows(): Promise<PurgeResult> {
  const limite = (dias: number) => new Date(Date.now() - dias * DAY_MS);

  const [notificaciones, auditoria, verificaciones] = await Promise.all([
    borrarHasta(
      () =>
        db.notification.findMany({
          where: { createdAt: { lt: limite(RETENCION.notificaciones) } },
          select: { id: true },
          take: BATCH_SIZE,
        }),
      (ids) => db.notification.deleteMany({ where: { id: { in: ids } } })
    ),
    borrarHasta(
      () =>
        db.auditLog.findMany({
          where: { createdAt: { lt: limite(RETENCION.auditoria) } },
          select: { id: true },
          take: BATCH_SIZE,
        }),
      (ids) => db.auditLog.deleteMany({ where: { id: { in: ids } } })
    ),
    borrarHasta(
      () =>
        db.guestVerification.findMany({
          where: { createdAt: { lt: limite(RETENCION.verificaciones) } },
          select: { id: true },
          take: BATCH_SIZE,
        }),
      (ids) => db.guestVerification.deleteMany({ where: { id: { in: ids } } })
    ),
  ]);

  const total = notificaciones + auditoria + verificaciones;
  if (total > 0) {
    log.info("old rows purged", { notificaciones, auditoria, verificaciones });
  }

  return { notificaciones, auditoria, verificaciones };
}

async function borrarHasta(
  buscar: () => Promise<{ id: string }[]>,
  borrar: (ids: string[]) => Promise<{ count: number }>
): Promise<number> {
  const filas = await buscar();
  if (filas.length === 0) return 0;
  const { count } = await borrar(filas.map((fila) => fila.id));
  return count;
}

/** Exportado para los tests. */
export const PURGE_RETENTION_DAYS = RETENCION;
