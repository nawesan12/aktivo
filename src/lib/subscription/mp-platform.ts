import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from "mercadopago";

let _client: MercadoPagoConfig | null = null;

function getClient(): MercadoPagoConfig {
  if (!_client) {
    const token = process.env.MP_PLATFORM_ACCESS_TOKEN;
    if (!token) {
      throw new Error("MP_PLATFORM_ACCESS_TOKEN no configurado");
    }
    _client = new MercadoPagoConfig({ accessToken: token });
  }
  return _client;
}

export function getPlatformPreApproval() {
  return new PreApproval(getClient());
}

export function getPlatformPreApprovalPlan() {
  return new PreApprovalPlan(getClient());
}

export function getMPPlanId(plan: "PROFESSIONAL" | "ENTERPRISE"): string {
  const envKey = plan === "PROFESSIONAL"
    ? "MP_PLAN_PROFESSIONAL_ID"
    : "MP_PLAN_ENTERPRISE_ID";
  const id = process.env[envKey];
  if (!id) {
    throw new Error(`${envKey} no configurado`);
  }
  return id;
}
