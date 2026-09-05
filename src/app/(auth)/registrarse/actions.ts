"use server";

import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { signIn } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { trialEndsAtFromNow } from "@/lib/subscription/access";

const log = createLogger("auth:register");

export async function registerUser(formData: {
  name: string;
  businessName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, businessName, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "Ya existe una cuenta con ese email" };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate slug from business name
    const baseSlug = businessName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Unique, and not one of ours. A shop's page lives at the root, so a name
    // that resolves to a platform route would leave it without a public page.
    let slug = baseSlug;
    let counter = 1;
    while (isReservedSlug(slug) || (await db.business.findUnique({ where: { slug } }))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create User + Business + UserBusiness + BusinessSettings in transaction
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          hashedPassword,
          role: "BUSINESS_OWNER",
        },
      });

      const business = await tx.business.create({
        data: {
          name: businessName,
          slug,
          trialEndsAt: trialEndsAtFromNow(),
        },
      });

      await tx.businessSettings.create({
        data: {
          businessId: business.id,
          slotInterval: 30,
          minAdvanceHours: 2,
          maxAdvanceDays: 30,
          bufferMinutes: 0,
          allowGuestBooking: true,
          requireDeposit: false,
          paymentMode: "DISABLED",
          timezone: "America/Argentina/Buenos_Aires",
          currency: "ARS",
        },
      });

      await tx.userBusiness.create({
        data: {
          userId: user.id,
          businessId: business.id,
          role: "BUSINESS_OWNER",
          isActive: true,
        },
      });
    });

    // Auto sign-in after registration
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    log.error("registration failed", error);
    return { success: false, error: "Error al crear la cuenta. Intenta nuevamente." };
  }
}
