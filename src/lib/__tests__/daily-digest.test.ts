import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const settingsFindMany = vi.fn();
const settingsUpdate = vi.fn();
const appointmentFindMany = vi.fn();
const sendMail = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    businessSettings: {
      findMany: (...a: unknown[]) => settingsFindMany(...a),
      update: (...a: unknown[]) => settingsUpdate(...a),
    },
    appointment: { findMany: (...a: unknown[]) => appointmentFindMany(...a) },
  },
}));

vi.mock("@/lib/notifications/daily-digest-email", () => ({
  sendDailyDigestEmail: (...a: unknown[]) => sendMail(...a),
}));

const { sendDailyDigests } = await import("@/lib/jobs/daily-digest");

/** Un negocio listo para recibir el resumen. */
function negocio(overrides: Record<string, unknown> = {}) {
  return {
    businessId: "b1",
    business: {
      name: "El Corte",
      email: "local@elcorte.test",
      isActive: true,
      members: [{ user: { email: "duenio@elcorte.test" } }],
      ...overrides,
    },
  };
}

function turno(hora: string, cliente = "Sofía") {
  return {
    dateTime: new Date(`2026-09-09T${hora}:00.000Z`),
    service: { name: "Corte" },
    staff: { name: "Martín" },
    user: null,
    guestClient: { name: cliente },
  };
}

/** Las 20:00 en Argentina, que es cuando la ventana está abierta. */
function alAtardecer() {
  vi.setSystemTime(new Date("2026-09-08T23:00:00.000Z"));
}

beforeEach(() => {
  vi.useFakeTimers();
  alAtardecer();
  settingsFindMany.mockReset().mockResolvedValue([]);
  settingsUpdate.mockReset().mockResolvedValue({});
  appointmentFindMany.mockReset().mockResolvedValue([]);
  sendMail.mockReset().mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("cuándo sale el resumen", () => {
  it("no manda nada antes de la tarde", async () => {
    // Las 10 de la mañana en Argentina: la agenda de mañana todavía se mueve.
    vi.setSystemTime(new Date("2026-09-08T13:00:00.000Z"));

    expect(await sendDailyDigests()).toEqual({ sent: 0, skipped: 0, failed: 0 });
    expect(settingsFindMany).not.toHaveBeenCalled();
  });

  it("a la tarde manda el de los turnos de mañana", async () => {
    settingsFindMany.mockResolvedValue([negocio()]);
    appointmentFindMany.mockResolvedValue([turno("12:00"), turno("14:30", "Juan")]);

    const result = await sendDailyDigests();

    expect(result.sent).toBe(1);
    const [to, businessName, , lista] = sendMail.mock.calls[0];
    expect(to).toBe("duenio@elcorte.test");
    expect(businessName).toBe("El Corte");
    expect(lista).toHaveLength(2);
    expect(lista[0].clientName).toBe("Sofía");
  });
});

describe("a quién le llega", () => {
  it("a la cuenta que dio de alta el negocio, no al correo público", async () => {
    settingsFindMany.mockResolvedValue([negocio()]);
    appointmentFindMany.mockResolvedValue([turno("12:00")]);

    await sendDailyDigests();

    // El email del local es de cara al público y puede ser un buzón que nadie
    // abre; el dueño es quien mira la agenda.
    expect(sendMail.mock.calls[0][0]).toBe("duenio@elcorte.test");
  });

  it("y si no hay dueño cargado, al correo del local", async () => {
    settingsFindMany.mockResolvedValue([negocio({ members: [] })]);
    appointmentFindMany.mockResolvedValue([turno("12:00")]);

    await sendDailyDigests();

    expect(sendMail.mock.calls[0][0]).toBe("local@elcorte.test");
  });

  it("sin ninguna dirección, no se manda al vacío", async () => {
    settingsFindMany.mockResolvedValue([negocio({ members: [], email: null })]);

    const result = await sendDailyDigests();

    expect(sendMail).not.toHaveBeenCalled();
    expect(result.skipped).toBe(1);
  });

  it("un negocio dado de baja no recibe nada", async () => {
    settingsFindMany.mockResolvedValue([negocio({ isActive: false })]);

    await sendDailyDigests();

    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe("una sola vez por día", () => {
  /*
    El trabajo es oportunista: lo dispara el tráfico real, así que corre muchas
    veces por tarde. Sin reservar el día antes de mandar, cada visita al sitio
    entre las siete y la medianoche sería otro correo igual.
  */
  it("reserva el día antes de mandar", async () => {
    settingsFindMany.mockResolvedValue([negocio()]);
    appointmentFindMany.mockResolvedValue([turno("12:00")]);

    await sendDailyDigests();

    expect(settingsUpdate).toHaveBeenCalledTimes(1);
    const orden = settingsUpdate.mock.invocationCallOrder[0];
    expect(orden).toBeLessThan(sendMail.mock.invocationCallOrder[0]);
  });

  it("y lo marca igual cuando mañana está vacío, para no volver a mirar", async () => {
    settingsFindMany.mockResolvedValue([negocio()]);
    appointmentFindMany.mockResolvedValue([]);

    const result = await sendDailyDigests();

    // Un correo diario que dice "mañana no tenés turnos" es el que enseña a
    // ignorar los correos.
    expect(sendMail).not.toHaveBeenCalled();
    expect(settingsUpdate).toHaveBeenCalledTimes(1);
    expect(result.skipped).toBe(1);
  });

  it("sólo busca negocios que todavía no recibieron el de mañana", async () => {
    settingsFindMany.mockResolvedValue([]);

    await sendDailyDigests();

    const where = settingsFindMany.mock.calls[0][0].where;
    expect(where.dailyDigestEnabled).toBe(true);
    expect(where.OR).toEqual([
      { dailyDigestSentFor: null },
      { dailyDigestSentFor: { lt: expect.any(Date) } },
    ]);
  });
});

describe("qué turnos entran", () => {
  it("los de mañana, y sólo los que siguen en pie", async () => {
    settingsFindMany.mockResolvedValue([negocio()]);
    appointmentFindMany.mockResolvedValue([turno("12:00")]);

    await sendDailyDigests();

    const where = appointmentFindMany.mock.calls[0][0].where;
    expect(where.status).toEqual({ in: ["PENDING", "CONFIRMED"] });
    // Un día entero, de medianoche a medianoche en la zona del negocio.
    const horas =
      (where.dateTime.lt.getTime() - where.dateTime.gte.getTime()) / (60 * 60 * 1000);
    expect(horas).toBe(24);
  });

  it("un fallo al mandar no rompe la pasada de los demás", async () => {
    settingsFindMany.mockResolvedValue([negocio(), { ...negocio(), businessId: "b2" }]);
    appointmentFindMany.mockResolvedValue([turno("12:00")]);
    sendMail.mockRejectedValueOnce(new Error("Resend caído"));

    const result = await sendDailyDigests();

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(1);
  });
});
