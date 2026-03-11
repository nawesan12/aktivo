import { db } from "@/lib/db";
import { sendWhatsAppText } from "@/lib/notifications/whatsapp";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.GUEST_JWT_SECRET || process.env.NEXTAUTH_SECRET || "guest-secret"
);

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(
  phone: string,
  code: string,
  businessName: string
): Promise<void> {
  const text = `Tu codigo de verificacion para ${businessName} es: ${code}\n\nExpira en 10 minutos.`;
  await sendWhatsAppText(phone, text);
}

export async function createVerification(phone: string, code: string): Promise<void> {
  // Delete old codes for this phone
  await db.guestVerification.deleteMany({ where: { phone } });

  await db.guestVerification.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });
}

export async function verifyCode(
  phone: string,
  code: string,
  businessId: string
): Promise<{ guestClientId: string } | null> {
  const verification = await db.guestVerification.findFirst({
    where: {
      phone,
      code,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verification) return null;

  // Delete used verification
  await db.guestVerification.delete({ where: { id: verification.id } });

  // Find the guest client for this business
  const guestClient = await db.guestClient.findUnique({
    where: { businessId_phone: { businessId, phone } },
  });

  if (!guestClient) return null;

  return { guestClientId: guestClient.id };
}

export async function createGuestToken(
  guestClientId: string,
  businessId: string
): Promise<string> {
  return new SignJWT({ guestClientId, businessId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyGuestToken(
  token: string
): Promise<{ guestClientId: string; businessId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      guestClientId: payload.guestClientId as string,
      businessId: payload.businessId as string,
    };
  } catch {
    return null;
  }
}
