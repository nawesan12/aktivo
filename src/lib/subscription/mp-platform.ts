import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from "mercadopago";
import { env } from "@/lib/env";

let _client: MercadoPagoConfig | null = null;

function getClient(): MercadoPagoConfig {
  if (!_client) {
    const token = env.MP_PLATFORM_ACCESS_TOKEN;
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

export interface AuthorizedPayment {
  id: string;
  preapproval_id?: string;
  status?: string;
  payment?: { status?: string };
  transaction_amount?: number;
  next_retry_date?: string;
  debit_date?: string;
}

/**
 * The monthly charge behind a subscription.
 *
 * Fetched over REST because the SDK has no wrapper for `/authorized_payments`,
 * and this is the only signal that tells us a renewal was rejected — the
 * preapproval itself may stay "authorized" while MercadoPago keeps retrying.
 */
export async function getAuthorizedPayment(id: string): Promise<AuthorizedPayment | null> {
  const token = env.MP_PLATFORM_ACCESS_TOKEN;
  if (!token) throw new Error("MP_PLATFORM_ACCESS_TOKEN no configurado");

  const response = await fetch(`https://api.mercadopago.com/authorized_payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`MercadoPago respondió ${response.status} al leer el cobro ${id}`);
  }

  return (await response.json()) as AuthorizedPayment;
}
