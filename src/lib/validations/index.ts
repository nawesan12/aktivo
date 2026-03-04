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
    message: "Las contrasenas no coinciden",
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
