import "dotenv/config";

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const FORMATS = [
  "5492236327551",  // +54 9 223 632 7551 (with mobile 9)
  "542236327551",   // +54 223 632 7551 (without mobile 9)
];

async function sendTestMessage(to: string) {
  console.log(`\nTrying format: ${to}`);

  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: `Hola! Este es un mensaje de prueba de *Aktivo* 🚀\n\nTu plataforma de turnos está funcionando correctamente.\n\n✅ WhatsApp API conectada\n✅ Notificaciones activas\n✅ Listo para producción`,
      },
    }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (res.ok) {
    console.log("✅ Message sent successfully!");
    return true;
  }
  return false;
}

async function main() {
  console.log(`Phone Number ID: ${PHONE_NUMBER_ID}`);
  for (const fmt of FORMATS) {
    const ok = await sendTestMessage(fmt);
    if (ok) break;
  }
}

main().catch(console.error);
