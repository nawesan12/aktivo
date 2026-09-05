import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { getMPClient, getBusinessMPToken } from "@/lib/mercadopago";
import { sendNotification } from "@/lib/notifications";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "payments:configure");

    const { id } = await params;

    const payment = await db.payment.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        appointment: {
          include: {
            service: true,
            staff: true,
            user: { select: { name: true, email: true, phone: true } },
            guestClient: { select: { name: true, email: true, phone: true } },
            business: { select: { name: true, slug: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    if (payment.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Solo se pueden reembolsar pagos aprobados" },
        { status: 400 }
      );
    }

    // Call MercadoPago refund API
    //
    // The refund has to go through the same account that took the money. If the
    // connection is gone, marking the payment REFUNDED here would tell the
    // owner the customer was paid back when nobody was paid back.
    if (payment.mpPaymentId) {
      const token = await getBusinessMPToken(session.businessId);

      if (!token) {
        return NextResponse.json(
          {
            error:
              "No se puede devolver: la cuenta de Mercado Pago del negocio no está conectada. Reconectala e intentá de nuevo.",
          },
          { status: 409 }
        );
      }

      const mp = getMPClient(token);
      await mp.refund.total({ payment_id: Number(payment.mpPaymentId) });
    }

    // Update payment and appointment status
    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      }),
      db.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: "CANCELLED" },
      }),
    ]);

    // Send cancellation notification
    const client = payment.appointment.user || payment.appointment.guestClient;
    if (client) {
      await sendNotification({
        businessId: session.businessId,
        businessName: payment.appointment.business.name,
        businessSlug: payment.appointment.business.slug,
        appointmentId: payment.appointmentId,
        clientName: client.name || "Cliente",
        clientEmail: client.email || undefined,
        serviceName: payment.appointment.service.name,
        staffName: payment.appointment.staff.name,
        dateTime: payment.appointment.dateTime,
        type: "cancellation",
      });
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "payment:refund",
      entity: "Payment",
      entityId: payment.id,
      details: { amount: payment.amount, mpPaymentId: payment.mpPaymentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
