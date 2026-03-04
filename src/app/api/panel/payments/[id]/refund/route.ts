import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { getMPClient } from "@/lib/mercadopago";
import { sendNotification } from "@/lib/notifications";
import { logAction } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "payments:configure");

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
            business: { select: { name: true } },
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
    if (payment.mpPaymentId) {
      const mpConfig = await db.businessConfig.findUnique({
        where: {
          businessId_key: {
            businessId: session.businessId,
            key: "mp_access_token",
          },
        },
      });

      const mp = getMPClient(mpConfig?.value || undefined);
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
        appointmentId: payment.appointmentId,
        clientName: client.name || "Cliente",
        clientPhone: client.phone || undefined,
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
    console.error("Refund error:", error);
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
