import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const notifFind = vi.fn();
const notifDelete = vi.fn();
const auditFind = vi.fn();
const auditDelete = vi.fn();
const verifFind = vi.fn();
const verifDelete = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      findMany: (...a: unknown[]) => notifFind(...a),
      deleteMany: (...a: unknown[]) => notifDelete(...a),
    },
    auditLog: {
      findMany: (...a: unknown[]) => auditFind(...a),
      deleteMany: (...a: unknown[]) => auditDelete(...a),
    },
    guestVerification: {
      findMany: (...a: unknown[]) => verifFind(...a),
      deleteMany: (...a: unknown[]) => verifDelete(...a),
    },
  },
}));

const { purgeOldRows, PURGE_RETENTION_DAYS } = await import("@/lib/jobs/purge");

const AHORA = new Date("2026-09-05T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AHORA);
  for (const fn of [notifFind, auditFind, verifFind]) fn.mockReset().mockResolvedValue([]);
  for (const fn of [notifDelete, auditDelete, verifDelete]) fn.mockReset().mockResolvedValue({ count: 0 });
});

afterEach(() => {
  vi.useRealTimers();
});

/*
  Ninguna de estas tablas se podaba, y las tres crecen con el uso: un negocio con
  diez turnos por día genera unas mil notificaciones por mes, más una fila de
  auditoría por cada cosa que toca en el panel. En una base que se paga por
  almacenamiento, eso es plata por filas que nadie vuelve a leer.
*/
describe("qué se tira y qué no", () => {
  it("no borra nada cuando no hay nada viejo", async () => {
    expect(await purgeOldRows()).toEqual({
      notificaciones: 0,
      auditoria: 0,
      verificaciones: 0,
    });
    expect(notifDelete).not.toHaveBeenCalled();
    expect(auditDelete).not.toHaveBeenCalled();
  });

  it("respeta la retención de cada tabla", async () => {
    await purgeOldRows();

    const dias = (fn: typeof notifFind) => {
      const limite = fn.mock.calls[0][0].where.createdAt.lt as Date;
      return Math.round((AHORA.getTime() - limite.getTime()) / (24 * 60 * 60 * 1000));
    };

    expect(dias(notifFind)).toBe(PURGE_RETENTION_DAYS.notificaciones);
    // La auditoría se guarda más tiempo a propósito: es lo que se mira cuando
    // algo no cierra.
    expect(dias(auditFind)).toBe(PURGE_RETENTION_DAYS.auditoria);
    expect(dias(auditFind)).toBeGreaterThan(dias(notifFind));
    // Los códigos de acceso nacen con diez minutos de vida.
    expect(dias(verifFind)).toBe(PURGE_RETENTION_DAYS.verificaciones);
  });

  it("borra por id y de a tandas, no con un DELETE gigante", async () => {
    notifFind.mockResolvedValue([{ id: "n1" }, { id: "n2" }]);
    notifDelete.mockResolvedValue({ count: 2 });

    const result = await purgeOldRows();

    expect(result.notificaciones).toBe(2);
    expect(notifDelete).toHaveBeenCalledWith({ where: { id: { in: ["n1", "n2"] } } });
    // Un tope por pasada: la primera corrida sobre una base que nunca se limpió
    // no puede quedarse con la conexión.
    expect(notifFind.mock.calls[0][0].take).toBeGreaterThan(0);
  });

  it("cada tabla se poda por su cuenta", async () => {
    auditFind.mockResolvedValue([{ id: "a1" }]);
    auditDelete.mockResolvedValue({ count: 1 });

    const result = await purgeOldRows();

    expect(result).toEqual({ notificaciones: 0, auditoria: 1, verificaciones: 0 });
  });
});
