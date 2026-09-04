import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { requirePlan } from "@/lib/subscription/enforcement";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import {
  addDomain,
  domainState,
  isCustomDomainConfigured,
  normalizeDomain,
  removeDomain,
  APEX_A_RECORD,
  SUBDOMAIN_CNAME,
} from "@/lib/custom-domain";
import { z } from "zod";

const bodySchema = z.object({ domain: z.string().min(1, "Escribí un dominio") });

/**
 * The state of the business's own domain, checked against Vercel rather than
 * remembered. DNS lives at the owner's registrar and can change without anyone
 * telling us, so a stored "verified" would go stale silently.
 */
export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:read");

    const business = await db.business.findUniqueOrThrow({
      where: { id: session.businessId },
      select: { customDomain: true, customDomainStatus: true },
    });

    if (!business.customDomain) {
      return NextResponse.json({
        configured: isCustomDomainConfigured(),
        domain: null,
        status: "NONE",
        aRecord: APEX_A_RECORD,
        cname: SUBDOMAIN_CNAME,
      });
    }

    const state = await domainState(business.customDomain);

    // Keep the stored status in step with what Vercel says, so the host lookup
    // that serves the page agrees with the screen the owner is looking at.
    const status = state.verified ? "ACTIVE" : "PENDING";
    if (status !== business.customDomainStatus) {
      await db.business.update({
        where: { id: session.businessId },
        data: { customDomainStatus: status },
      });
    }

    return NextResponse.json({ configured: true, status, ...state });
  } catch (error) {
    return handleApiError(error, "panel:dominio:GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");
    await requirePlan(session.businessId, "ENTERPRISE");

    const { domain } = bodySchema.parse(await request.json());
    const normalized = normalizeDomain(domain);

    // Checked before calling Vercel so the owner gets our wording rather than
    // "domain_already_in_use" for a domain another Jiku business connected.
    const taken = await db.business.findFirst({
      where: { customDomain: normalized, NOT: { id: session.businessId } },
      select: { id: true },
    });
    if (taken) throw new ValidationError("Ese dominio ya está conectado a otro negocio");

    const state = await addDomain(normalized);

    await db.business.update({
      where: { id: session.businessId },
      data: {
        customDomain: normalized,
        customDomainStatus: state.verified ? "ACTIVE" : "PENDING",
        customDomainAddedAt: new Date(),
      },
    });
    // Nothing to purge: the custom domain rewrites to the same path the page is
    // already cached under, so both hosts serve the same rendered page. The
    // canonical URL stays on jikuapp.com, which is deliberate — the point of the
    // domain is the owner's branding on the link they hand out, not a second
    // copy of the page competing with the first in search.
    return NextResponse.json({
      configured: true,
      status: state.verified ? "ACTIVE" : "PENDING",
      ...state,
    });
  } catch (error) {
    return handleApiError(error, "panel:dominio:POST");
  }
}

export async function DELETE() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");

    const business = await db.business.findUniqueOrThrow({
      where: { id: session.businessId },
      select: { customDomain: true },
    });

    if (business.customDomain) await removeDomain(business.customDomain);

    await db.business.update({
      where: { id: session.businessId },
      data: { customDomain: null, customDomainStatus: "NONE", customDomainAddedAt: null },
    });

    return NextResponse.json({ configured: isCustomDomainConfigured(), domain: null, status: "NONE" });
  } catch (error) {
    return handleApiError(error, "panel:dominio:DELETE");
  }
}
