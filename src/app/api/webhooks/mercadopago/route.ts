import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMPClient } from "@/lib/mercadopago";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MercadoPago IPN notification
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ received: true });
    }

    const paymentId = String(body.data.id);

    // Get payment info from MercadoPago
    const mpClient = getMPClient();
    const mpPayment = await mpClient.payment.get({ id: paymentId });

    if (!mpPayment || !mpPayment.external_reference) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const appointmentId = mpPayment.external_reference;
    const mpStatus = mpPayment.status; // approved, rejected, pending, etc.

    // Find our payment record
    const payment = await db.payment.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            service: { select: { name: true } },
            staff: { select: { name: true } },
            user: { select: { name: true, phone: true, email: true } },
            guestClient: { select: { name: true, phone: true, email: true } },
            business: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Map MP status to our status
    let paymentStatus: "APPROVED" | "REJECTED" | "PENDING" | "IN_PROCESS" | "CANCELLED";
    let appointmentStatus: string | null = null;

    switch (mpStatus) {
      case "approved":
        paymentStatus = "APPROVED";
        appointmentStatus = "CONFIRMED";
        break;
      case "rejected":
        paymentStatus = "REJECTED";
        break;
      case "in_process":
        paymentStatus = "IN_PROCESS";
        break;
      case "cancelled":
        paymentStatus = "CANCELLED";
        break;
      default:
        paymentStatus = "PENDING";
    }

    // Update payment record
    await db.payment.update({
      where: { id: payment.id },
      data: {
        mpPaymentId: paymentId,
        mpStatus: mpStatus || null,
        status: paymentStatus,
      },
    });

    // Update appointment status if payment approved
    if (appointmentStatus) {
      await db.appointment.update({
        where: { id: appointmentId },
        data: { status: appointmentStatus as "CONFIRMED" },
      });
    }

    // Send notification on payment confirmation
    if (mpStatus === "approved" && payment.appointment) {
      const apt = payment.appointment;
      const clientName = apt.user?.name || apt.guestClient?.name || "Cliente";
      const clientPhone = apt.user?.phone || apt.guestClient?.phone;
      const clientEmail = apt.user?.email || apt.guestClient?.email;

      sendNotification({
        businessId: apt.business.id,
        businessName: apt.business.name,
        appointmentId,
        clientName,
        clientPhone: clientPhone || undefined,
        clientEmail: clientEmail || undefined,
        serviceName: apt.service.name,
        staffName: apt.staff.name,
        dateTime: apt.dateTime,
        type: "confirmation",
      }).catch(console.error);
    }

    await logAction({
      businessId: payment.businessId,
      action: "payment:webhook",
      entity: "Payment",
      entityId: payment.id,
      details: { mpPaymentId: paymentId, mpStatus, paymentStatus },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
