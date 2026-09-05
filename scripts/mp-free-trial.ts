// Must come first: importing `env` reads the validated environment.
import "dotenv/config";

import { TRIAL_DAYS } from "@/lib/subscription/access";

/**
 * Le agrega la semana bonificada a los planes de suscripción de MercadoPago.
 *
 * Es lo que convierte "probá gratis y después decidí si pagás" en "quedate
 * suscripto, que la primera semana no se cobra". El momento de decidir pagar es
 * donde se va la gente: si MercadoPago ya tiene el medio de pago, el día ocho
 * cobra solo y no hay decisión que tomar.
 *
 * `free_trial` va dentro de `auto_recurring`, y se puede sumar a un plan que ya
 * existe con un PUT — no hace falta crear planes nuevos ni tocar los ids que
 * están en las variables de entorno.
 *
 *   npx tsx scripts/mp-free-trial.ts           # muestra cómo están hoy
 *   npx tsx scripts/mp-free-trial.ts --apply   # les pone la prueba
 *
 * Contra producción:
 *   MP_PLATFORM_ACCESS_TOKEN="..." MP_PLAN_PROFESSIONAL_ID="..." \
 *   MP_PLAN_ENTERPRISE_ID="..." npx tsx scripts/mp-free-trial.ts --apply
 */

const API = "https://api.mercadopago.com/preapproval_plan";

interface Plan {
  id: string;
  reason?: string;
  auto_recurring?: {
    frequency?: number;
    frequency_type?: string;
    transaction_amount?: number;
    currency_id?: string;
    free_trial?: { frequency: number; frequency_type: string };
  };
}

async function mp(path: string, init?: RequestInit): Promise<Plan> {
  const token = process.env.MP_PLATFORM_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_PLATFORM_ACCESS_TOKEN");

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status} ${JSON.stringify(body)}`);
  }
  return body as Plan;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const planes = [
    { nombre: "Inicial (PROFESSIONAL)", id: process.env.MP_PLAN_PROFESSIONAL_ID },
    { nombre: "Completo (ENTERPRISE)", id: process.env.MP_PLAN_ENTERPRISE_ID },
  ];

  for (const { nombre, id } of planes) {
    if (!id) {
      console.log(`${nombre}: sin id configurado, se saltea.`);
      continue;
    }

    const actual = await mp(`/${id}`);
    const trial = actual.auto_recurring?.free_trial;

    console.log(
      `\n${nombre} (${id})\n` +
        `  cobra: ${actual.auto_recurring?.transaction_amount} ${actual.auto_recurring?.currency_id} ` +
        `cada ${actual.auto_recurring?.frequency} ${actual.auto_recurring?.frequency_type}\n` +
        `  prueba: ${trial ? `${trial.frequency} ${trial.frequency_type}` : "ninguna"}`
    );

    if (trial?.frequency === TRIAL_DAYS && trial.frequency_type === "days") {
      console.log("  ya tiene la semana puesta, no se toca.");
      continue;
    }

    if (!apply) {
      console.log(`  → le pondría ${TRIAL_DAYS} días. Corré con --apply para escribirlo.`);
      continue;
    }

    // Sólo `free_trial`: mandar el resto del `auto_recurring` de vuelta es
    // arriesgarse a pisar el precio con una copia vieja.
    await mp(`/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        auto_recurring: {
          free_trial: { frequency: TRIAL_DAYS, frequency_type: "days" },
        },
      }),
    });
    console.log(`  ✓ ${TRIAL_DAYS} días de prueba aplicados.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
