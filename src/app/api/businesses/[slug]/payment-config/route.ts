import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await resolveBusinessBySlug(slug);

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const settings = business.settings;

    return NextResponse.json({
      paymentMode: settings?.paymentMode ?? "DISABLED",
      depositPercentage: settings?.depositPercentage ?? null,
      depositFixedAmount: settings?.depositFixedAmount ? Number(settings.depositFixedAmount) : null,
      currency: settings?.currency ?? "ARS",
    });
  } catch (error) {
    return handleApiError(error, "businesses:slug:payment-config");
  }
}
