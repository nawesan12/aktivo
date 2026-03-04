import twilio from "twilio";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toArgentinaDate } from "@/lib/timezone";

const client =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

interface WhatsAppMessage {
  to: string;
  type: "confirmation" | "reminder" | "cancellation";
  businessName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: Date;
}

function formatWhatsAppPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `whatsapp:+${cleaned}`;
}

function getMessageBody(data: WhatsAppMessage): string {
  const dt = toArgentinaDate(data.dateTime);
  const dateStr = format(dt, "EEEE d 'de' MMMM", { locale: es });
  const timeStr = format(dt, "HH:mm");

  const messages = {
    confirmation: `Hola ${data.clientName}! Tu turno en ${data.businessName} fue confirmado.\n\nServicio: ${data.serviceName}\nProfesional: ${data.staffName}\nFecha: ${dateStr}\nHora: ${timeStr}\n\nTe esperamos!`,
    reminder: `Hola ${data.clientName}! Te recordamos que manana tenes turno en ${data.businessName}.\n\nServicio: ${data.serviceName}\nProfesional: ${data.staffName}\nHora: ${timeStr}\n\nTe esperamos!`,
    cancellation: `Hola ${data.clientName}. Tu turno en ${data.businessName} fue cancelado.\n\nServicio: ${data.serviceName}\nFecha: ${dateStr}\nHora: ${timeStr}\n\nPodes reservar un nuevo turno en nuestra web.`,
  };

  return messages[data.type];
}

export async function sendWhatsApp(data: WhatsAppMessage) {
  if (!client) {
    console.log("[WhatsApp] Twilio not configured. Message:", getMessageBody(data));
    return;
  }

  const message = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
    to: formatWhatsAppPhone(data.to),
    body: getMessageBody(data),
  });

  return message.sid;
}
