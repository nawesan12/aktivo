import { Resend } from "resend";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toArgentinaDate } from "@/lib/timezone";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailData {
  to: string;
  type: "confirmation" | "reminder" | "cancellation";
  businessName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: Date;
}

function getSubject(type: string, businessName: string): string {
  const subjects: Record<string, string> = {
    confirmation: `Turno Confirmado - ${businessName}`,
    reminder: `Recordatorio de Turno - ${businessName}`,
    cancellation: `Turno Cancelado - ${businessName}`,
  };
  return subjects[type] || businessName;
}

function getEmailHtml(data: EmailData): string {
  const dt = toArgentinaDate(data.dateTime);
  const dateStr = format(dt, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const timeStr = format(dt, "HH:mm");

  const statusMessages: Record<string, string> = {
    confirmation: "Tu turno fue confirmado exitosamente.",
    reminder: "Te recordamos que manana tenes un turno.",
    cancellation: "Tu turno fue cancelado.",
  };

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="background:linear-gradient(135deg,#6366F1,#22D3EE);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;margin:0;">
        ${data.businessName}
      </h1>
      <p style="color:#a1a1aa;font-size:12px;margin:4px 0 0;">Powered by Aktivo</p>
    </div>
    <div style="background-color:#18181b;border-radius:12px;padding:32px;border:1px solid rgba(255,255,255,0.1);">
      <h2 style="color:#fafafa;font-size:20px;margin:0 0 16px 0;">
        Hola ${data.clientName}!
      </h2>
      <p style="color:#a1a1aa;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
        ${statusMessages[data.type]}
      </p>
      <div style="background-color:#09090b;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#a1a1aa;padding:8px 0;font-size:14px;">Servicio</td>
            <td style="color:#fafafa;padding:8px 0;font-size:14px;text-align:right;font-weight:600;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="color:#a1a1aa;padding:8px 0;font-size:14px;">Profesional</td>
            <td style="color:#fafafa;padding:8px 0;font-size:14px;text-align:right;font-weight:600;">${data.staffName}</td>
          </tr>
          <tr>
            <td style="color:#a1a1aa;padding:8px 0;font-size:14px;">Fecha</td>
            <td style="color:#fafafa;padding:8px 0;font-size:14px;text-align:right;font-weight:600;">${dateStr}</td>
          </tr>
          <tr>
            <td style="color:#a1a1aa;padding:8px 0;font-size:14px;">Hora</td>
            <td style="color:#6366F1;padding:8px 0;font-size:18px;text-align:right;font-weight:700;">${timeStr}</td>
          </tr>
        </table>
      </div>
      ${
        data.type !== "cancellation"
          ? `<p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0;">Te esperamos!</p>`
          : `<p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0;">Podes reservar un nuevo turno en nuestra web.</p>`
      }
    </div>
    <p style="text-align:center;color:#52525b;font-size:12px;margin-top:24px;">
      ${data.businessName} &middot; Powered by Aktivo
    </p>
  </div>
</body>
</html>`;
}

export async function sendEmail(data: EmailData) {
  if (!resend) {
    console.log("[Email] Resend not configured. Subject:", getSubject(data.type, data.businessName));
    return;
  }

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM || `${data.businessName} <onboarding@resend.dev>`,
    to: data.to,
    subject: getSubject(data.type, data.businessName),
    html: getEmailHtml(data),
  });

  return result;
}
