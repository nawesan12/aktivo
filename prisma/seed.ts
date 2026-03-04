import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Aktivo database...");

  // ── 1. Platform Admin ──────────────────
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@aktivo.app" },
    update: {},
    create: {
      name: "Admin Aktivo",
      email: "admin@aktivo.app",
      hashedPassword: adminPassword,
      role: "PLATFORM_ADMIN",
    },
  });
  console.log("Admin created:", admin.email);

  // ── 2. Demo Business: Barberia "El Corte" ──
  const business = await db.business.upsert({
    where: { slug: "el-corte" },
    update: {},
    create: {
      name: "El Corte Barberia",
      slug: "el-corte",
      description: "La mejor barberia de la ciudad. Estilo, calidad y onda.",
      phone: "2234567890",
      whatsapp: "5492234567890",
      email: "info@elcorte.com",
      address: "Av. Colon 1234",
      city: "Mar del Plata",
      province: "Buenos Aires",
      primaryColor: "#6366F1",
      accentColor: "#22D3EE",
      plan: "STARTER",
    },
  });
  console.log("Business created:", business.name);

  // ── 3. Business Settings ───────────────
  await db.businessSettings.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      slotInterval: 30,
      minAdvanceHours: 2,
      maxAdvanceDays: 30,
      bufferMinutes: 10,
      allowGuestBooking: true,
      paymentMode: "PERCENTAGE",
      depositPercentage: 30,
      cancellationPolicy:
        "Cancelaciones con menos de 2 horas de anticipacion pueden tener cargo.",
    },
  });

  // ── 4. Business Owner ──────────────────
  const ownerPassword = await bcrypt.hash("owner123", 12);
  const owner = await db.user.upsert({
    where: { email: "owner@elcorte.com" },
    update: {},
    create: {
      name: "Carlos Ramirez",
      email: "owner@elcorte.com",
      hashedPassword: ownerPassword,
      role: "BUSINESS_OWNER",
    },
  });

  await db.userBusiness.upsert({
    where: { userId_businessId: { userId: owner.id, businessId: business.id } },
    update: {},
    create: {
      userId: owner.id,
      businessId: business.id,
      role: "BUSINESS_OWNER",
    },
  });
  console.log("Owner created:", owner.email);

  // ── 5. Service Categories ──────────────
  const catCortes = await db.serviceCategory.create({
    data: { businessId: business.id, name: "Cortes", sortOrder: 0 },
  });
  const catBarba = await db.serviceCategory.create({
    data: { businessId: business.id, name: "Barba", sortOrder: 1 },
  });
  const catCombos = await db.serviceCategory.create({
    data: { businessId: business.id, name: "Combos", sortOrder: 2 },
  });

  // ── 6. Services ────────────────────────
  const services = await Promise.all([
    db.service.create({
      data: {
        businessId: business.id,
        categoryId: catCortes.id,
        name: "Corte Clasico",
        description: "Corte con tijera y maquina, lavado incluido",
        duration: 30,
        price: 5500,
        sortOrder: 0,
      },
    }),
    db.service.create({
      data: {
        businessId: business.id,
        categoryId: catCortes.id,
        name: "Corte Premium",
        description: "Corte a medida con asesoramiento personalizado",
        duration: 45,
        price: 7500,
        sortOrder: 1,
      },
    }),
    db.service.create({
      data: {
        businessId: business.id,
        categoryId: catCortes.id,
        name: "Corte Kids",
        description: "Corte para ninos hasta 12 anos",
        duration: 20,
        price: 4000,
        sortOrder: 2,
      },
    }),
    db.service.create({
      data: {
        businessId: business.id,
        categoryId: catBarba.id,
        name: "Perfilado de Barba",
        description: "Delineado y perfilado con navaja",
        duration: 20,
        price: 3500,
        sortOrder: 0,
      },
    }),
    db.service.create({
      data: {
        businessId: business.id,
        categoryId: catBarba.id,
        name: "Barba Completa",
        description: "Recorte, perfilado y toalla caliente",
        duration: 30,
        price: 5000,
        sortOrder: 1,
      },
    }),
    db.service.create({
      data: {
        businessId: business.id,
        categoryId: catCombos.id,
        name: "Combo Corte + Barba",
        description: "Corte clasico + barba completa con descuento",
        duration: 60,
        price: 9000,
        sortOrder: 0,
      },
    }),
  ]);
  console.log("Services created:", services.length);

  // ── 7. Staff Members ───────────────────
  const staff1 = await db.staffMember.create({
    data: {
      businessId: business.id,
      name: "Martin Lopez",
      email: "martin@elcorte.com",
      phone: "2234111222",
      bio: "Barbero profesional con 8 anos de experiencia. Especialista en degradados.",
      specialty: "Degradados y disenos",
      sortOrder: 0,
    },
  });

  const staff2 = await db.staffMember.create({
    data: {
      businessId: business.id,
      name: "Diego Fernandez",
      email: "diego@elcorte.com",
      phone: "2234333444",
      bio: "Experto en cortes clasicos y barbas. Atencion personalizada.",
      specialty: "Cortes clasicos y barbas",
      sortOrder: 1,
    },
  });

  const staff3 = await db.staffMember.create({
    data: {
      businessId: business.id,
      name: "Lucas Gomez",
      email: "lucas@elcorte.com",
      phone: "2234555666",
      bio: "Joven talento con estilo moderno. Fan del fade y texturas.",
      specialty: "Fades y texturas",
      sortOrder: 2,
    },
  });
  console.log("Staff created: 3");

  // ── 8. Staff-Service Assignments ───────
  const allStaff = [staff1, staff2, staff3];
  for (const staff of allStaff) {
    for (const service of services) {
      await db.staffService.create({
        data: { staffId: staff.id, serviceId: service.id },
      });
    }
  }
  console.log("Staff-service assignments created");

  // ── 9. Working Hours (Mon-Sat) ─────────
  const schedule = [
    { day: 1, start: "09:00", end: "13:00" }, // Mon morning
    { day: 1, start: "15:00", end: "20:00" }, // Mon afternoon (handled as single block)
    { day: 2, start: "09:00", end: "20:00" },
    { day: 3, start: "09:00", end: "20:00" },
    { day: 4, start: "09:00", end: "20:00" },
    { day: 5, start: "09:00", end: "20:00" },
    { day: 6, start: "09:00", end: "14:00" },
  ];

  // Simplified: single block per day for seed
  const dailySchedule = [
    { day: 1, start: "09:00", end: "20:00" },
    { day: 2, start: "09:00", end: "20:00" },
    { day: 3, start: "09:00", end: "20:00" },
    { day: 4, start: "09:00", end: "20:00" },
    { day: 5, start: "09:00", end: "20:00" },
    { day: 6, start: "09:00", end: "14:00" },
  ];

  for (const staff of allStaff) {
    for (const { day, start, end } of dailySchedule) {
      await db.workingHours.create({
        data: {
          staffId: staff.id,
          dayOfWeek: day,
          startTime: start,
          endTime: end,
          isActive: true,
        },
      });
    }
  }
  console.log("Working hours created for all staff");

  // ── 10. Recurring lunch break ──────────
  for (const staff of allStaff) {
    for (const day of [1, 2, 3, 4, 5]) {
      await db.recurringBlockedSlot.create({
        data: { staffId: staff.id, dayOfWeek: day, time: "13:00" },
      });
      await db.recurringBlockedSlot.create({
        data: { staffId: staff.id, dayOfWeek: day, time: "13:30" },
      });
    }
  }
  console.log("Recurring lunch breaks created");

  // ── 11. Demo Guest Client ──────────────
  const guest = await db.guestClient.create({
    data: {
      businessId: business.id,
      name: "Juan Perez",
      phone: "5492234999888",
      email: "juan@email.com",
    },
  });

  // ── 12. Demo Appointment ───────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 30);

  await db.appointment.create({
    data: {
      businessId: business.id,
      serviceId: services[0].id,
      staffId: staff1.id,
      guestClientId: guest.id,
      dateTime: tomorrow,
      endTime: tomorrowEnd,
      status: "CONFIRMED",
      notes: "Cliente regular",
    },
  });
  console.log("Demo appointment created");

  // ── 13. Second business for multi-tenant test ──
  const business2 = await db.business.upsert({
    where: { slug: "bella-vita" },
    update: {},
    create: {
      name: "Bella Vita Salon",
      slug: "bella-vita",
      description: "Salon de belleza premium con los mejores profesionales.",
      phone: "2235551234",
      email: "info@bellavita.com",
      address: "San Martin 567",
      city: "Mar del Plata",
      province: "Buenos Aires",
      primaryColor: "#EC4899",
      accentColor: "#F59E0B",
      plan: "FREE",
    },
  });
  console.log("Second business created:", business2.name);

  console.log("\nSeed completed successfully!");
  console.log("─────────────────────────────────");
  console.log("Admin login:  admin@aktivo.app / admin123");
  console.log("Owner login:  owner@elcorte.com / owner123");
  console.log("Business URL: /el-corte");
  console.log("─────────────────────────────────");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
