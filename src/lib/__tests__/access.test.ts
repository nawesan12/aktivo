import { describe, it, expect, vi, beforeEach } from "vitest";

const businessFindUniqueOrThrow = vi.fn();
const subscriptionFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    business: { findUniqueOrThrow: (...a: unknown[]) => businessFindUniqueOrThrow(...a) },
    subscription: { findFirst: (...a: unknown[]) => subscriptionFindFirst(...a) },
  },
}));

const { getBusinessAccess, assertBusinessCanWrite, trialEndsAtFromNow, TRIAL_DAYS } =
  await import("@/lib/subscription/access");

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);

beforeEach(() => {
  vi.clearAllMocks();
  businessFindUniqueOrThrow.mockResolvedValue({ trialEndsAt: null, groupId: null });
  subscriptionFindFirst.mockResolvedValue(null);
});

describe("acceso de un negocio", () => {
  it("durante la prueba puede operar", async () => {
    businessFindUniqueOrThrow.mockResolvedValue({ trialEndsAt: inDays(3), groupId: null });

    const access = await getBusinessAccess("biz-1");

    expect(access.blocked).toBe(false);
    expect(access.trialDaysLeft).toBe(3);
  });

  it("vencida la prueba y sin suscripción, queda bloqueado", async () => {
    businessFindUniqueOrThrow.mockResolvedValue({ trialEndsAt: inDays(-1), groupId: null });

    const access = await getBusinessAccess("biz-1");

    expect(access.blocked).toBe(true);
    expect(access.trialDaysLeft).toBe(0);
    await expect(assertBusinessCanWrite("biz-1")).rejects.toThrow(/prueba/i);
  });

  it("con suscripción no se bloquea aunque la prueba haya vencido", async () => {
    businessFindUniqueOrThrow.mockResolvedValue({ trialEndsAt: inDays(-30), groupId: null });
    subscriptionFindFirst.mockResolvedValue({ id: "sub-1" });

    const access = await getBusinessAccess("biz-1");

    expect(access.blocked).toBe(false);
    expect(access.hasSubscription).toBe(true);
  });

  it("una sucursal se cubre con la suscripción del grupo", async () => {
    // Si no, cada local nuevo nacería bloqueado — justo lo que el plan más caro
    // dice que podés hacer.
    businessFindUniqueOrThrow.mockResolvedValue({ trialEndsAt: null, groupId: "grp-1" });
    subscriptionFindFirst.mockResolvedValue({ id: "sub-1" });

    await getBusinessAccess("biz-2");

    expect(subscriptionFindFirst.mock.calls[0][0].where).toMatchObject({
      business: { groupId: "grp-1" },
    });
  });

  it("una suscripción pausada cuenta sólo mientras corre la gracia", async () => {
    await getBusinessAccess("biz-1");

    const or = subscriptionFindFirst.mock.calls[0][0].where.OR;
    const paused = or.find((c: { status: string }) => c.status === "PAUSED");
    expect(paused.OR).toEqual([
      { gracePeriodEnd: null },
      { gracePeriodEnd: { gt: expect.any(Date) } },
    ]);
  });

  it("la prueba nueva dura una semana", () => {
    expect(TRIAL_DAYS).toBe(7);

    const days = (trialEndsAtFromNow().getTime() - Date.now()) / 86_400_000;
    expect(Math.round(days)).toBe(7);
  });
});
