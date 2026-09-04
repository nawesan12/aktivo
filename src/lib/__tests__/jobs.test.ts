import { describe, it, expect, vi, beforeEach } from "vitest";

const queryRaw = vi.fn();
const jobRunUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    jobRun: { update: (...args: unknown[]) => jobRunUpdate(...args) },
  },
}));

const expireHolds = vi.fn();
const reminders = vi.fn();
const dailyOnly = vi.fn();

/*
  A stand-in registry, not the real one: this file is about the runner, not
  about which jobs exist. `daily-only` is the shape that matters — a job with
  `opportunistic: false`, which the traffic-driven tick has to leave alone.
*/
vi.mock("@/lib/jobs/registry", () => ({
  JOBS: [
    { name: "expire-holds", intervalSeconds: 300, opportunistic: true, run: () => expireHolds() },
    { name: "reminders", intervalSeconds: 300, opportunistic: true, run: () => reminders() },
    { name: "daily-only", intervalSeconds: 43200, opportunistic: false, run: () => dailyOnly() },
  ],
}));

const { runDueJobs, maybeTick } = await import("@/lib/jobs/tick");

/** The claim returns a row when this process won it, nothing when it lost. */
const won = () => queryRaw.mockResolvedValue([{ name: "x" }]);
const lost = () => queryRaw.mockResolvedValue([]);

beforeEach(() => {
  vi.clearAllMocks();
  jobRunUpdate.mockResolvedValue({});
  expireHolds.mockResolvedValue({ released: 0 });
  reminders.mockResolvedValue({ sent: 0 });
  dailyOnly.mockResolvedValue([]);
});

describe("tick oportunista", () => {
  it("no hace nada cuando otra instancia ya tomó el turno", async () => {
    lost();

    expect(await maybeTick()).toBeNull();
    expect(expireHolds).not.toHaveBeenCalled();
  });

  it("deja el trabajo diario afuera: no puede depender del tráfico", async () => {
    won();

    const result = await runDueJobs();

    expect(reminders).toHaveBeenCalled();
    // Lo que tiene que salir un día puntual no puede depender de que ese día
    // haya habido visitas: si no las hubo, se pierde para siempre y en silencio.
    expect(dailyOnly).not.toHaveBeenCalled();
    expect(result.ran).not.toHaveProperty("daily-only");
  });

  it("saltea el job que otra instancia ya reclamó, sin frenar los demás", async () => {
    queryRaw
      .mockResolvedValueOnce([]) // expire-holds: lo tiene otro
      .mockResolvedValueOnce([{ name: "reminders" }]);

    const result = await runDueJobs();

    expect(expireHolds).not.toHaveBeenCalled();
    expect(reminders).toHaveBeenCalled();
    expect(result.skipped).toContain("expire-holds");
  });

  it("un job roto no impide que corran los otros", async () => {
    won();
    expireHolds.mockRejectedValue(new Error("la base se cayó"));

    const result = await runDueJobs();

    expect(result.ran["expire-holds"]).toEqual({ failed: true });
    expect(reminders).toHaveBeenCalled();
  });

  it("guarda el error del job para poder verlo después", async () => {
    won();
    expireHolds.mockRejectedValue(new Error("la base se cayó"));

    await runDueJobs();

    expect(jobRunUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: "expire-holds" },
        data: expect.objectContaining({ lastError: "la base se cayó" }),
      })
    );
  });
});

describe("corrida forzada del cron diario", () => {
  it("corre todo sin pedir permiso al throttle", async () => {
    lost(); // el claim diría que no, y aun así tiene que correr

    const result = await runDueJobs({ force: true });

    expect(expireHolds).toHaveBeenCalled();
    expect(dailyOnly).toHaveBeenCalled();
    expect(result.skipped).toEqual([]);
  });

  it("marca las filas igual, para que el próximo tick no repita el trabajo", async () => {
    lost();

    await runDueJobs({ force: true });

    expect(jobRunUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: "daily-only" },
        data: expect.objectContaining({ runs: { increment: 1 } }),
      })
    );
  });
});
