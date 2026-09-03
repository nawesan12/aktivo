import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const appointmentUpdateMany = vi.fn();
const paymentUpdateMany = vi.fn();
const transaction = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    appointment: {
      findMany: (...args: unknown[]) => findMany(...args),
      updateMany: (...args: unknown[]) => appointmentUpdateMany(...args),
    },
    payment: {
      updateMany: (...args: unknown[]) => paymentUpdateMany(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

const { releaseExpiredHolds } = await import("@/lib/bookings/expiry");

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockResolvedValue([]);
});

describe("liberar reservas impagas", () => {
  it("no toca la base cuando no hay nada vencido", async () => {
    findMany.mockResolvedValue([]);

    const result = await releaseExpiredHolds({ businessId: "biz-1" });

    expect(result).toEqual({ released: 0 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("cancela el turno y su pago pendiente en una sola transacción", async () => {
    findMany.mockResolvedValue([{ id: "apt-1" }, { id: "apt-2" }]);

    const result = await releaseExpiredHolds({ businessId: "biz-1" });

    expect(result).toEqual({ released: 2 });
    expect(transaction).toHaveBeenCalledTimes(1);

    expect(appointmentUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["apt-1", "apt-2"] } },
      data: { status: "CANCELLED", expiresAt: null },
    });

    // Otherwise the charge lingers as a debt against a turn that no longer exists.
    expect(paymentUpdateMany).toHaveBeenCalledWith({
      where: { appointmentId: { in: ["apt-1", "apt-2"] }, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  });

  it("sólo busca reservas vencidas esperando pago, acotadas al negocio", async () => {
    findMany.mockResolvedValue([]);

    await releaseExpiredHolds({ businessId: "biz-1" });

    const where = findMany.mock.calls[0][0].where;
    expect(where.businessId).toBe("biz-1");
    expect(where.status).toBe("PENDING_PAYMENT");
    expect(where.expiresAt.not).toBe(null);
    expect(where.expiresAt.lte).toBeInstanceOf(Date);
  });

  it("acota cuánto libera por pasada, para no correr sin techo", async () => {
    findMany.mockResolvedValue([]);

    await releaseExpiredHolds({}, 25);

    expect(findMany.mock.calls[0][0].take).toBe(25);
  });

  it("sin negocio barre toda la plataforma: es el barrido del cron diario", async () => {
    findMany.mockResolvedValue([]);

    await releaseExpiredHolds();

    const where = findMany.mock.calls[0][0].where;
    expect(where.businessId).toBeUndefined();
    expect(where.staffId).toBeUndefined();
  });
});
