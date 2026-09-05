import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const cookiesMock = vi.fn();
const verifyClientTokenMock = vi.fn();
const guestFindMany = vi.fn();
const userFindUnique = vi.fn();
const appointmentUpdateMany = vi.fn();

vi.mock("next/headers", () => ({ cookies: () => cookiesMock() }));
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/client-auth", () => ({
  verifyClientToken: (...a: unknown[]) => verifyClientTokenMock(...a),
}));
vi.mock("@/lib/db", () => ({
  db: {
    guestClient: {
      findMany: (...a: unknown[]) => guestFindMany(...a),
      findFirst: vi.fn(),
    },
    user: { findUnique: (...a: unknown[]) => userFindUnique(...a) },
    appointment: { updateMany: (...a: unknown[]) => appointmentUpdateMany(...a) },
  },
}));

const { resolveClientIdentity, clientAppointmentWhere, claimGuestAppointments } = await import(
  "@/lib/client-identity"
);

beforeEach(() => {
  authMock.mockReset().mockResolvedValue(null);
  cookiesMock.mockReset().mockResolvedValue({ get: () => undefined });
  verifyClientTokenMock.mockReset();
  guestFindMany.mockReset().mockResolvedValue([]);
  userFindUnique.mockReset().mockResolvedValue(null);
  appointmentUpdateMany.mockReset().mockResolvedValue({ count: 0 });
});

/*
  El bug que originó todo esto: quien reservaba con sesión iniciada quedaba con
  el turno colgado de su `userId` y sin ninguna fila de invitado, así que el
  portal —que sólo miraba invitados, y por teléfono— le contestaba que no había
  turnos con ese número. Un número que nunca le habíamos pedido.
*/
describe("de qué turnos es dueño alguien", () => {
  it("junta las dos mitades: la cuenta y lo reservado como invitado", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", email: "Lucia@Example.com", name: "Lucía" } });
    guestFindMany.mockResolvedValue([{ id: "g1" }, { id: "g2" }]);

    const identity = await resolveClientIdentity();

    expect(identity).toMatchObject({ userId: "u1", email: "lucia@example.com", via: "session" });
    expect(identity!.guestClientIds).toEqual(["g1", "g2"]);
    expect(clientAppointmentWhere(identity!)).toEqual({
      OR: [{ userId: "u1" }, { guestClientId: { in: ["g1", "g2"] } }],
    });
  });

  it("con sesión y sin filas de invitado, filtra sólo por la cuenta", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", email: "lucia@example.com" } });

    const identity = await resolveClientIdentity();

    expect(clientAppointmentWhere(identity!)).toEqual({ userId: "u1" });
  });

  it("una identidad vacía no puede ver los turnos de nadie", () => {
    const where = clientAppointmentWhere({
      userId: null,
      email: null,
      name: null,
      guestClientIds: [],
      via: "link",
    });

    // No `{}`: eso sería "todos los turnos de todos los clientes".
    expect(where).toEqual({ id: { in: [] } });
  });
});

describe("entrar sin cuenta", () => {
  it("reservar deja una sesión que alcanza lo reservado como invitado", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "tok" }) });
    verifyClientTokenMock.mockResolvedValue({
      email: "lucia@example.com",
      name: "Lucía",
      verified: false,
    });
    guestFindMany.mockResolvedValue([{ id: "g1" }]);

    const identity = await resolveClientIdentity();

    expect(identity).toMatchObject({
      userId: null,
      email: "lucia@example.com",
      name: "Lucía",
      via: "booking",
    });
  });

  /*
    Escribir el email de otra persona en un formulario de reserva no prueba
    nada sobre poder leerlo. Si esa sesión resolviera la cuenta, reservar un
    corte a nombre de alguien alcanzaría para ver toda su agenda.
  */
  it("una sesión sin verificar no llega a la cuenta de ese email", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "tok" }) });
    verifyClientTokenMock.mockResolvedValue({ email: "lucia@example.com", verified: false });
    userFindUnique.mockResolvedValue({ id: "u9", name: "Lucía" });

    const identity = await resolveClientIdentity();

    expect(identity!.userId).toBeNull();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("abrir el link del email sí: ahí queda demostrado que lee la casilla", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "tok" }) });
    verifyClientTokenMock.mockResolvedValue({ email: "lucia@example.com", verified: true });
    userFindUnique.mockResolvedValue({ id: "u9", name: "Lucía" });

    const identity = await resolveClientIdentity();

    expect(identity).toMatchObject({ userId: "u9", name: "Lucía", via: "link" });
  });

  it("sin cookie ni sesión no hay identidad", async () => {
    expect(await resolveClientIdentity()).toBeNull();
  });

  it("un token que no verifica tampoco alcanza", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "falsificado" }) });
    verifyClientTokenMock.mockResolvedValue(null);

    expect(await resolveClientIdentity()).toBeNull();
  });
});

describe("reclamar lo reservado antes de tener cuenta", () => {
  it("no toca un turno que ya tiene dueño", async () => {
    guestFindMany.mockResolvedValue([{ id: "g1" }]);
    appointmentUpdateMany.mockResolvedValue({ count: 2 });

    expect(await claimGuestAppointments("u1", "Lucia@example.com ")).toBe(2);
    expect(appointmentUpdateMany).toHaveBeenCalledWith({
      where: { guestClientId: { in: ["g1"] }, userId: null },
      data: { userId: "u1" },
    });
  });

  it("sin filas de invitado no escribe nada", async () => {
    expect(await claimGuestAppointments("u1", "nadie@example.com")).toBe(0);
    expect(appointmentUpdateMany).not.toHaveBeenCalled();
  });
});
