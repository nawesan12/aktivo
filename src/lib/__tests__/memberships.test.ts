import { describe, it, expect, vi, beforeEach } from "vitest";

const aggregate = vi.fn();
const creditFindFirst = vi.fn();
const creditCreate = vi.fn();
const membershipFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    membershipCredit: {
      aggregate: (...a: unknown[]) => aggregate(...a),
      findFirst: (...a: unknown[]) => creditFindFirst(...a),
      create: (...a: unknown[]) => creditCreate(...a),
    },
    membership: { findFirst: (...a: unknown[]) => membershipFindFirst(...a) },
  },
}));

const { spendVisit, refundVisit, membershipBalance, periodEnd } = await import(
  "@/lib/memberships"
);

beforeEach(() => {
  aggregate.mockReset();
  creditFindFirst.mockReset();
  creditCreate.mockReset();
});

describe("el saldo sale del libro mayor", () => {
  it("suma los movimientos en vez de leer un contador", async () => {
    aggregate.mockResolvedValue({ _sum: { amount: 3 } });
    await expect(membershipBalance("m1")).resolves.toBe(3);
  });

  it("una membresía sin movimientos vale cero, no undefined", async () => {
    aggregate.mockResolvedValue({ _sum: { amount: null } });
    await expect(membershipBalance("m1")).resolves.toBe(0);
  });
});

describe("gastar una visita", () => {
  const tx = {
    membershipCredit: {
      aggregate: (...a: unknown[]) => aggregate(...a),
      create: (...a: unknown[]) => creditCreate(...a),
    },
  };

  it("descuenta una y deja el movimiento atado al turno", async () => {
    aggregate.mockResolvedValue({ _sum: { amount: 2 } });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      spendVisit(tx as any, { businessId: "b1", membershipId: "m1", appointmentId: "a1" })
    ).resolves.toBe(true);

    expect(creditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: -1, appointmentId: "a1" }),
      })
    );
  });

  it("sin saldo no gasta y avisa, para que la reserva siga por el camino de siempre", async () => {
    aggregate.mockResolvedValue({ _sum: { amount: 0 } });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      spendVisit(tx as any, { businessId: "b1", membershipId: "m1", appointmentId: "a1" })
    ).resolves.toBe(false);
    expect(creditCreate).not.toHaveBeenCalled();
  });

  it("lee el saldo dentro de la transacción, no el que le pasaron", async () => {
    // Two bookings arriving together both saw "1 left" before the transaction.
    // Only the one that reads inside it can lose.
    aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await spendVisit(tx as any, { businessId: "b1", membershipId: "m1", appointmentId: "a2" });
    expect(aggregate).toHaveBeenCalled();
  });
});

describe("devolver una visita al cancelar", () => {
  it("devuelve la que se gastó", async () => {
    creditFindFirst
      .mockResolvedValueOnce({ businessId: "b1", membershipId: "m1", amount: -1 })
      .mockResolvedValueOnce(null);

    await refundVisit("a1");

    expect(creditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 1 }) })
    );
  });

  it("no devuelve dos veces el mismo turno", async () => {
    creditFindFirst
      .mockResolvedValueOnce({ businessId: "b1", membershipId: "m1", amount: -1 })
      .mockResolvedValueOnce({ id: "ya-devuelto" });

    await refundVisit("a1");
    expect(creditCreate).not.toHaveBeenCalled();
  });

  it("no inventa un crédito para un turno que nunca usó abono", async () => {
    creditFindFirst.mockResolvedValueOnce(null);
    await refundVisit("a1");
    expect(creditCreate).not.toHaveBeenCalled();
  });
});

describe("periodEnd", () => {
  it("cuenta los días desde el momento dado", () => {
    const from = new Date("2026-09-04T12:00:00Z");
    expect(periodEnd(30, from).toISOString()).toBe("2026-10-04T12:00:00.000Z");
  });
});
