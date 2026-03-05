import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface ReviewRequestData {
  to: string;
  clientName: string;
  businessName: string;
  serviceName: string;
  reviewUrl: string;
}

function getReviewEmailHtml(data: ReviewRequestData): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
        <div style="background:#18181b;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,0.06);">
          <h1 style="color:#f4f4f5;font-size:22px;margin:0 0 8px;">
            ¿Cómo fue tu experiencia?
          </h1>
          <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Hola ${data.clientName}, tu visita a <strong style="color:#f4f4f5;">${data.businessName}</strong> nos importa.
            Nos encantaría saber cómo fue tu experiencia con <strong style="color:#f4f4f5;">${data.serviceName}</strong>.
          </p>
          <a href="${data.reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#22D3EE);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;">
            Dejar mi reseña
          </a>
          <p style="color:#71717a;font-size:13px;margin:24px 0 0;line-height:1.5;">
            Este enlace expira en 7 días. Tu opinión nos ayuda a mejorar.
          </p>
        </div>
        <p style="color:#52525b;font-size:12px;text-align:center;margin:16px 0 0;">
          Powered by Jiku
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function sendReviewRequestEmail(data: ReviewRequestData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[Review Email] Resend not configured, skipping:", data.to);
    return { success: false, error: "Resend not configured" };
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Jiku <noreply@jiku.app>",
      to: data.to,
      subject: `¿Cómo fue tu visita? - ${data.businessName}`,
      html: getReviewEmailHtml(data),
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending review email";
    console.error("[Review Email] Error:", message);
    return { success: false, error: message };
  }
}
