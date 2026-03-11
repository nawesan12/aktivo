import { z } from "zod";

// ── Auth ──────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Minimo 2 caracteres"),
    businessName: z.string().min(2, "Minimo 2 caracteres"),
    email: z.string().email("Email invalido"),
    password: z.string().min(6, "Minimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// ── Business ─────────────────────────────

export const businessSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres"),
  slug: z
    .string()
    .min(3, "Minimo 3 caracteres")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
  description: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
});

// ── Services ─────────────────────────────

export const serviceSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres"),
  description: z.string().optional(),
  duration: z.number().min(5, "Minimo 5 minutos").max(480, "Maximo 8 horas"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ── Staff ────────────────────────────────

export const staffSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
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

export const guestInfoSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres"),
  phone: z.string().min(10, "Minimo 10 digitos"),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
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

// ── Payment Config ───────────────────────

export const paymentConfigSchema = z.object({
  paymentMode: z.enum(["DISABLED", "FULL", "PERCENTAGE", "FIXED"]),
  depositPercentage: z.number().min(1).max(100).optional(),
  depositFixedAmount: z.number().min(0).optional(),
  mpAccessToken: z.string().optional(),
});

// ── Campaigns ───────────────────────────

export const campaignSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  type: z.enum(["BIRTHDAY", "REBOOKING", "INACTIVITY", "CUSTOM"]),
  messageSubject: z.string().max(200).optional().nullable(),
  messageBody: z.string().min(1, "Mensaje requerido").max(5000),
  channel: z.enum(["EMAIL", "WHATSAPP"]).default("EMAIL"),
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
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    website: z.string().optional(),
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
