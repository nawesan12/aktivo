import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { AppError, ValidationError } from "@/lib/api-errors";

const log = createLogger("custom-domain");

const API = "https://api.vercel.com";

/**
 * A business pointing its own domain at its page.
 *
 * The domain is registered against the Vercel project, which is what terminates
 * TLS and routes the request; the app then resolves the incoming host back to a
 * business. Both halves are needed — a domain added here but not at Vercel gets
 * a certificate error, and one added at Vercel but not here lands on the
 * marketing site.
 */

export interface DomainVerification {
  type: string;
  domain: string;
  value: string;
  reason?: string;
}

export interface DomainState {
  domain: string;
  /** True once Vercel is serving it: DNS points here and the certificate is issued. */
  verified: boolean;
  /** The records the owner has to create at their registrar, when it is not verified yet. */
  verification: DomainVerification[];
  /** What to put in an A record when the domain is an apex (mibarberia.com). */
  aRecord: string;
  /** What to put in a CNAME when it is a subdomain (turnos.mibarberia.com). */
  cname: string;
}

/** Vercel's published targets. Constants rather than magic strings in the UI. */
export const APEX_A_RECORD = "76.76.21.21";
export const SUBDOMAIN_CNAME = "cname.vercel-dns.com";

/** True when this deployment can register domains at all. */
export function isCustomDomainConfigured(): boolean {
  return Boolean(env.VERCEL_API_TOKEN && env.VERCEL_PROJECT_ID);
}

async function vercelFetch(path: string, init?: RequestInit) {
  if (!isCustomDomainConfigured()) {
    throw new AppError("Los dominios propios no están configurados en este servidor", 503);
  }

  const separator = path.includes("?") ? "&" : "?";
  const url = `${API}${path}${env.VERCEL_TEAM_ID ? `${separator}teamId=${env.VERCEL_TEAM_ID}` : ""}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

/**
 * What a domain has to look like to be worth sending to Vercel.
 *
 * Deliberately strict: this string ends up as a unique key, in DNS
 * instructions, and in a URL. A value with a scheme, a path or a port in it
 * would be accepted by the API and then never match an incoming host.
 */
export function normalizeDomain(input: string): string {
  const domain = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
    throw new ValidationError("Ese dominio no parece válido. Ejemplo: mibarberia.com");
  }

  if (domain.length > 253) {
    throw new ValidationError("El dominio es demasiado largo");
  }

  // Our own domain cannot be handed to a business: it would take over the
  // marketing site and every panel on it.
  const appHost = new URL(env.NEXT_PUBLIC_APP_URL).hostname.replace(/^www\./, "");
  if (domain === appHost || domain.endsWith(`.${appHost}`) || domain.endsWith(".vercel.app")) {
    throw new ValidationError("Ese dominio no se puede usar");
  }

  return domain;
}

/** Registers the domain against the project and reports what DNS still needs. */
export async function addDomain(domain: string): Promise<DomainState> {
  const added = await vercelFetch(`/v10/projects/${env.VERCEL_PROJECT_ID}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });

  // Already registered on this project is success, not a failure: the owner
  // clicked twice, or is re-verifying after fixing their DNS.
  const alreadyMine = added.status === 409 && added.body?.error?.code === "domain_already_in_use";

  if (!added.ok && !alreadyMine) {
    const code = added.body?.error?.code;
    log.error("vercel rejected a domain", undefined, { domain, code, status: added.status });

    if (code === "domain_already_in_use" || code === "forbidden") {
      throw new ValidationError(
        "Ese dominio ya está en uso en otra cuenta. Sacalo de ahí y volvé a intentar."
      );
    }
    throw new AppError("No pudimos registrar el dominio. Probá de nuevo en un rato.", 502);
  }

  return domainState(domain);
}

/** Whether Vercel is serving the domain yet, and what is missing if it is not. */
export async function domainState(domain: string): Promise<DomainState> {
  const [config, project] = await Promise.all([
    vercelFetch(`/v6/domains/${domain}/config`),
    vercelFetch(`/v9/projects/${env.VERCEL_PROJECT_ID}/domains/${domain}`),
  ]);

  // `misconfigured` is Vercel's own answer to "is DNS pointing here": it is the
  // one signal that reflects the registrar, not our database.
  const misconfigured = config.body?.misconfigured !== false;
  const verified = project.ok && project.body?.verified === true && !misconfigured;

  return {
    domain,
    verified,
    verification: Array.isArray(project.body?.verification) ? project.body.verification : [],
    aRecord: APEX_A_RECORD,
    cname: SUBDOMAIN_CNAME,
  };
}

/** Takes the domain off the project. Safe to call for one that was never added. */
export async function removeDomain(domain: string): Promise<void> {
  const result = await vercelFetch(
    `/v9/projects/${env.VERCEL_PROJECT_ID}/domains/${domain}`,
    { method: "DELETE" }
  );

  if (!result.ok && result.status !== 404) {
    log.error("could not remove a domain", undefined, { domain, status: result.status });
    throw new AppError("No pudimos desconectar el dominio. Probá de nuevo.", 502);
  }
}

/**
 * The business a request arrived for, by the host it came in on.
 *
 * Only domains that finished verifying resolve: a half-configured one would
 * otherwise serve a business's page over a certificate that does not cover it.
 */
export async function businessSlugForHost(host: string): Promise<string | null> {
  const domain = host.toLowerCase().split(":")[0].replace(/^www\./, "");

  const business = await db.business.findFirst({
    where: { customDomain: domain, customDomainStatus: "ACTIVE", isActive: true },
    select: { slug: true },
  });

  return business?.slug ?? null;
}
