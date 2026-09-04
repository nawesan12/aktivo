/**
 * Fills the seeded business with a week of realistic traffic.
 *
 * The seed creates one appointment, which is enough for the end-to-end tests and
 * nothing like what a working shop looks like — every chart, every occupancy
 * figure and every empty state on the panel reads the same at zero. This adds a
 * week of turnos across both professionals, some paid deposits, a few reviews
 * and a waitlist queue, and puts the business on the top plan so the screens
 * behind a plan gate can actually be looked at.
 *
 *   npx tsx scripts/demo-data.ts
 */
// The env schema in src/lib/env.ts runs the moment src/lib/db is imported,
// and a plain `npx tsx` process has no .env loaded yet.
import "dotenv/config";
import { addDays, addMinutes, setHours, setMinutes, startOfDay, subDays } from "date-fns";

import { db } from "@/lib/db";

const SLUG = "el-corte";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Datos de demo en producción, no.");
  }

  const business = await db.business.findUnique({
    where: { slug: SLUG },
    include: { services: true, staff: true },
  });
  if (!business) throw new Error(`No existe el negocio ${SLUG}. Corré npm run db:seed primero.`);

  await db.business.update({
    where: { id: business.id },
    data: { plan: "ENTERPRISE" },
  });

  const services = business.services.filter((s) => s.isActive);
  const staff = business.staff.filter((s) => s.isActive);
  if (!services.length || !staff.length) throw new Error("El negocio no tiene servicios ni equipo.");

  // Re-runnable: drop what a previous run left before writing again.
  await db.payment.deleteMany({ where: { businessId: business.id, mpPaymentId: { startsWith: "demo-" } } });
  await db.appointment.deleteMany({ where: { businessId: business.id, notes: "demo" } });
  await db.waitlistEntry.deleteMany({ where: { businessId: business.id, phone: { startsWith: "5492235000" } } });

  const names = [
    "Lucía Fernández", "Matías López", "Camila Ruiz", "Sofía Herrera", "Tomás Gómez",
    "Julieta Sosa", "Nicolás Peralta", "Valentina Díaz", "Bruno Castro", "Martina Vega",
    "Agustín Rivas", "Florencia Molina", "Ramiro Ledesma", "Delfina Paz", "Ignacio Cabrera",
  ];

  const clients = [];
  for (const [index, name] of names.entries()) {
    const phone = `549223500${String(index).padStart(4, "0")}`;
    clients.push(
      await db.guestClient.upsert({
        where: { businessId_phone: { businessId: business.id, phone } },
        update: { name },
        create: { businessId: business.id, name, phone, email: null },
      })
    );
  }

  const today = startOfDay(new Date());
  const statuses = ["COMPLETED", "COMPLETED", "CONFIRMED", "CONFIRMED", "PENDING", "CANCELLED"] as const;
  let created = 0;

  // Six days behind and three ahead: enough for "últimos 7 días" to have a
  // shape and for "próximos turnos" to have rows.
  for (let offset = -6; offset <= 3; offset++) {
    const day = addDays(today, offset);
    if (day.getDay() === 0) continue; // cerrado los domingos

    const perDay = offset === 0 ? 6 : 2 + ((offset + 7) % 4);
    for (let n = 0; n < perDay; n++) {
      const service = services[(n + Math.abs(offset)) % services.length];
      const member = staff[n % staff.length];
      const client = clients[(n + Math.abs(offset) * 3) % clients.length];
      const dateTime = setMinutes(setHours(day, 9 + n * 2), n % 2 ? 30 : 0);
      const status = offset < 0 ? statuses[n % statuses.length] : offset === 0 && n < 2 ? "COMPLETED" : "CONFIRMED";

      const appointment = await db.appointment.create({
        data: {
          businessId: business.id,
          serviceId: service.id,
          staffId: member.id,
          guestClientId: client.id,
          dateTime,
          endTime: addMinutes(dateTime, service.duration),
          status,
          notes: "demo",
        },
      });
      created++;

      // Roughly a third arrive with the deposit already paid.
      if (status !== "CANCELLED" && n % 3 === 0) {
        await db.payment.create({
          data: {
            businessId: business.id,
            appointmentId: appointment.id,
            amount: Math.round(Number(service.price) * 0.3),
            mode: "PERCENTAGE",
            status: "APPROVED",
            mpPaymentId: `demo-${appointment.id}`,
            createdAt: dateTime,
          },
        });
      }
    }
  }

  for (let n = 0; n < 3; n++) {
    await db.waitlistEntry.create({
      data: {
        businessId: business.id,
        serviceId: services[n % services.length].id,
        name: names[n],
        phone: `549223500${String(90 + n).padStart(4, "0")}`,
        preferredDate: addDays(today, 2),
        expiresAt: addDays(today, 7),
      },
    });
  }

  const existingReviews = await db.review.count({ where: { businessId: business.id } });
  if (existingReviews === 0) {
    const done = await db.appointment.findMany({
      where: { businessId: business.id, status: "COMPLETED" },
      take: 4,
    });
    for (const [index, appointment] of done.entries()) {
      await db.review.create({
        data: {
          businessId: business.id,
          appointmentId: appointment.id,
          guestClientId: appointment.guestClientId,
          rating: [5, 5, 4, 5][index],
          comment: [
            "Impecable como siempre. Reservé por acá y no esperé nada.",
            "Muy buena atención, el corte quedó tal cual lo pedí.",
            "Todo bien, aunque tuve que esperar unos minutos.",
            "El mejor de la zona. Recomendadísimo.",
          ][index],
          isVisible: true,
          createdAt: subDays(new Date(), index + 1),
        },
      });
    }
  }

  console.log(`Listo: ${created} turnos, 3 en lista de espera, plan ENTERPRISE.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
