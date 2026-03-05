import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface CampaignEmailData {
  to: string;
  subject: string;
  body: string;
  businessName: string;
  // Variables for interpolation
  variables: Record<string, string>;
}

/**
 * Interpolate template variables: {{clientName}}, {{businessName}}, {{serviceName}}, etc.
 */
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

function getCampaignEmailHtml(data: CampaignEmailData): string {
  const body = interpolate(data.body, data.variables);
  const subject = interpolate(data.subject, data.variables);

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
        <div style="background:#18181b;border-radius:16px;padding:40px;border:1px solid rgba(255,255,255,0.06);">
          <h1 style="color:#f4f4f5;font-size:22px;margin:0 0 16px;">
            ${subject}
          </h1>
          <div style="color:#a1a1aa;font-size:15px;line-height:1.7;">
            ${body.split("\n").map((line) => `<p style="margin:0 0 12px;">${line}</p>`).join("")}
          </div>
        </div>
        <p style="color:#52525b;font-size:12px;text-align:center;margin:16px 0 0;">
          ${data.businessName} · Powered by Jiku
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function sendCampaignEmail(data: CampaignEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[Campaign Email] Resend not configured, skipping:", data.to);
    return { success: false, error: "Resend not configured" };
  }

  try {
    const subject = interpolate(data.subject, data.variables);

    await resend.emails.send({
      from: process.env.RESEND_FROM || "Jiku <noreply@jiku.app>",
      to: data.to,
      subject,
      html: getCampaignEmailHtml(data),
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sending campaign email";
    console.error("[Campaign Email] Error:", message);
    return { success: false, error: message };
  }
}
