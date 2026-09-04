import { z } from "zod";
import { isValidArgentinePhone } from "@/lib/phone";

// ── Auth ──────────────────────────────────

/**
 * Minimum for a password being *set*. Deliberately not applied to the login
 * form: the people who already have a six-character password have to be able
 * to get in and change it.
 */
export const PASSWORD_MIN_LENGTH = 10;

export const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`);

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Mínimo 2 caracteres"),
    businessName: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// ── Business ─────────────────────────────

/**
 * A phone number we can actually reach.
 *
 * `z.string().min(10)` accepted "0000000000" and rejected "+54 9 223 632-7551",
 * which is how half the people type it.
 *
 * Validation only — the value keeps the shape the user typed so react-hook-form
 * still sees one type in and the same type out. Normalisation happens where the
 * number is written to the database (see `normalisePhone`), which is what stops
 * one person becoming two clients depending on how they typed it.
 */
const argentinePhone = z
  .string()
  .refine(isValidArgentinePhone, "Teléfono argentino inválido");

/** Same rule, but the field may be left empty. */
const optionalArgentinePhone = z
  .string()
  .optional()
  .refine((value) => !value || isValidArgentinePhone(value), "Teléfono argentino inválido");

export const businessSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().optional(),
  phone: optionalArgentinePhone,
  whatsapp: optionalArgentinePhone,
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

// ── Services ─────────────────────────────

export const serviceSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
  duration: z.number().min(5, "Mínimo 5 minutos").max(480, "Máximo 8 horas"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ── Staff ────────────────────────────────

export const staffSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email().optional().or(z.literal("")),
  phone: optionalArgentinePhone,
  bio: z.string().max(500).optional(),
  specialty: z.string().optional(),
});

// ── Appointments ─────────────────────────

export const appointmentSchema = z.object({
  serviceId: z.string().min(1, "Selecciona un servicio"),
  staffId: z.string().min(1, "Selecciona un profesional"),
  dateTime: z.string().min(1, "Selecciona fecha y hora"),
  notes: z.string().max(500).optional(),
  recurrenceFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  recurrenceCount: z.number().min(2).max(12).optional(),
});

/**
 * Email is required, not a nicety. It is the only channel the product has: a
 * booking without one gets no confirmation, no reminder, no cancellation
 * notice, and its owner cannot get into "mis turnos" either.
 */
export const guestInfoSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: argentinePhone,
  email: z
    .string("Necesitamos tu email")
    .min(1, "Necesitamos tu email")
    .email("Email inválido"),
});

// ── Schedule ─────────────────────────────

export const workingHoursSchema = z
  .object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.isActive) return true;
      return data.startTime < data.endTime;
    },
    { message: "La hora de inicio debe ser anterior a la de fin" }
  );

/**
 * The whole schedule of one member of staff, as the panel saves it.
 *
 * `workingHoursSchema` existed with exactly the check that was missing —
 * start before end — and nothing used it: the endpoint read `request.json()`
 * and went straight to the database. A day saved as 18:00–09:00 was accepted,
 * the panel said "horarios guardados", and the availability engine produced
 * nothing for that day for ever after, with the public page reporting no times
 * and no reason.
 */
export const scheduleSchema = z.object({
  workingHours: z.array(workingHoursSchema).max(7).optional(),
  blockedDates: z
    .array(
      z.object({
        date: z.string().min(1),
        type: z.enum(["FULL_DAY", "PARTIAL"]).default("FULL_DAY"),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
        reason: z.string().max(200).optional().nullable(),
      })
    )
    .max(365)
    .optional(),
  recurringBlocks: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        time: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
      })
    )
    .max(100)
    .optional(),
  dateOverrides: z
    .array(
      z.object({
        date: z.string().min(1),
        time: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
        type: z.enum(["BLOCKED", "AVAILABLE"]).default("BLOCKED"),
      })
    )
    .max(365)
    .optional(),
});

// ── Payment Config ───────────────────────

export const paymentConfigSchema = z.object({
  paymentMode: z.enum(["DISABLED", "FULL", "PERCENTAGE", "FIXED"]),
  depositPercentage: z.number().min(1).max(100).optional(),
  depositFixedAmount: z.number().min(0).optional(),
});

// ── Campaigns ───────────────────────────

export const campaignSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  type: z.enum(["BIRTHDAY", "REBOOKING", "INACTIVITY", "CUSTOM"]),
  messageSubject: z.string().max(200).optional().nullable(),
  messageBody: z.string().min(1, "Mensaje requerido").max(5000),
  /** Email is the only delivery channel the product has. */
  channel: z.literal("EMAIL").default("EMAIL"),
  targetTagIds: z.array(z.string()).default([]),
  triggerConfig: z.record(z.string(), z.unknown()).optional().nullable(),
});

// ── Tags ────────────────────────────────

export const tagSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hexadecimal inválido").default("#6366F1"),
});

// ── Notes ───────────────────────────────

export const noteSchema = z.object({
  content: z.string().min(1, "Contenido requerido").max(2000),
});

// ── Settings ────────────────────────────

export const settingsSchema = z.object({
  business: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    // Zod strips what it does not declare, and these two were not declared: the
    // owner uploaded a logo, saw the preview, got "configuración guardada", and
    // it was gone on reload. There is no other write path for them.
    logo: z.string().optional(),
    coverImage: z.string().optional(),
    phone: optionalArgentinePhone,
    whatsapp: optionalArgentinePhone,
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    website: z.string().optional(),
    about: z.string().max(2000).optional(),
    instagram: z.string().max(120).optional(),
    facebook: z.string().max(200).optional(),
    tiktok: z.string().max(120).optional(),
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
  }).optional(),
  settings: z.object({
    slotInterval: z.number().min(5).max(120).optional(),
    minAdvanceHours: z.number().min(0).optional(),
    maxAdvanceDays: z.number().min(1).max(365).optional(),
    bufferMinutes: z.number().min(0).max(60).optional(),
    allowGuestBooking: z.boolean().optional(),
    reviewRequestDelayHours: z.number().min(0).optional(),
    noShowThreshold: z.number().min(1).optional(),
    noShowPenaltyDays: z.number().min(1).optional(),
    noShowAutoMark: z.boolean().optional(),
    widgetEnabled: z.boolean().optional(),
    widgetTheme: z.string().optional(),
    widgetPosition: z.string().optional(),
  }).optional(),
});

// ── Types ────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type StaffInput = z.infer<typeof staffSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
export type PaymentConfigInput = z.infer<typeof paymentConfigSchema>;
export type CampaignInput = z.input<typeof campaignSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
