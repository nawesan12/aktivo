import { describe, it, expect, vi, beforeEach } from "vitest";

const accountFindUnique = vi.fn();
const configFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    mercadoPagoAccount: { findUnique: (...a: unknown[]) => accountFindUnique(...a) },
    businessConfig: { findUnique: (...a: unknown[]) => configFindUnique(...a) },
  },
}));

const decryptSecret = vi.fn();
vi.mock("@/lib/crypto", () => ({
  decryptSecret: (...a: unknown[]) => decryptSecret(...a),
}));

const { getBusinessMPConnection, getBusinessMPToken } = await import("@/lib/mercadopago");

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);

beforeEach(() => {
  vi.clearAllMocks();
  accountFindUnique.mockResolvedValue(null);
  configFindUnique.mockResolvedValue(null);
  decryptSecret.mockImplementation((v: string) => `descifrado:${v}`);
});

describe("con qué cuenta se cobra", () => {
  it("sin nada configurado, no hay con qué cobrar", async () => {
    expect(await getBusinessMPConnection("biz-1")).toEqual({ status: "none" });
    expect(await getBusinessMPToken("biz-1")).toBeNull();
  });

  it("una cuenta vinculada devuelve su token y el id del vendedor", async () => {
    accountFindUnique.mockResolvedValue({
      accessToken: "cifrado",
      refreshToken: "cifrado-r",
      mpUserId: "12345",
      expiresAt: inDays(90),
    });

    const connection = await getBusinessMPConnection("biz-1");

    expect(connection).toMatchObject({
      status: "ok",
      accessToken: "descifrado:cifrado",
      mpUserId: "12345",
    });
  });

  it("una cuenta vencida no sirve para cobrar", async () => {
    accountFindUnique.mockResolvedValue({
      accessToken: "cifrado",
      refreshToken: "cifrado-r",
      mpUserId: "12345",
      expiresAt: inDays(-1),
    });

    expect((await getBusinessMPConnection("biz-1")).status).toBe("expired");
    expect(await getBusinessMPToken("biz-1")).toBeNull();
  });

  it("un token que no se puede descifrar NO cae a la cuenta de la plataforma", async () => {
    // Este es el caso que mandaba la plata de los clientes de un negocio a la
    // cuenta de Jiku: antes devolvía undefined y el cliente de MercadoPago
    // caía al token de plataforma sin decir nada.
    accountFindUnique.mockResolvedValue({
      accessToken: "corrupto",
      refreshToken: "corrupto",
      mpUserId: "12345",
      expiresAt: inDays(90),
    });
    decryptSecret.mockImplementation(() => {
      throw new Error("Malformed encrypted value");
    });

    expect((await getBusinessMPConnection("biz-1")).status).toBe("broken");
    expect(await getBusinessMPToken("biz-1")).toBeNull();
  });

  it("sigue funcionando el token pegado a mano antes de que existiera la vinculación", async () => {
    configFindUnique.mockResolvedValue({ value: "cifrado-viejo" });

    expect(await getBusinessMPConnection("biz-1")).toMatchObject({
      status: "ok",
      accessToken: "descifrado:cifrado-viejo",
      mpUserId: null,
    });
  });

  it("la cuenta vinculada gana sobre el token viejo", async () => {
    accountFindUnique.mockResolvedValue({
      accessToken: "cifrado-nuevo",
      refreshToken: "r",
      mpUserId: "12345",
      expiresAt: inDays(90),
    });
    configFindUnique.mockResolvedValue({ value: "cifrado-viejo" });

    expect(await getBusinessMPToken("biz-1")).toBe("descifrado:cifrado-nuevo");
  });
});
