import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";

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
    console.error("Error fetching payment config:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
