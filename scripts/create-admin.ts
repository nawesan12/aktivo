// Must come first: importing `db` reads the validated environment.
import "dotenv/config";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations";

/**
 * Creates the platform administrator.
 *
 * This exists so that production never has to run `prisma/seed.ts`, which
 * creates `admin@jiku.app` with the password `admin123` — a credential that is
 * published in this repository — along with two fake barbershops.
 *
 *   npx tsx scripts/create-admin.ts admin@jikuapp.com "Nombre Apellido"
 *
 * The password is generated here and printed once. It is never stored anywhere
 * else, so copy it before closing the terminal.
 */
async function main() {
  const [email, name] = process.argv.slice(2);

  if (!email || !name) {
    console.error('Uso: npx tsx scripts/create-admin.ts <email> "<nombre>"');
    process.exit(1);
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`Ya existe un usuario con ${email}.`);
    process.exit(1);
  }

  // 24 bytes of base64url: comfortably past the minimum, and nothing anybody
  // is going to guess.
  const password = randomBytes(24).toString("base64url");
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error("La contraseña generada quedó por debajo del mínimo");
  }

  const user = await db.user.create({
    data: {
      email,
      name,
      role: "PLATFORM_ADMIN",
      hashedPassword: await bcrypt.hash(password, 12),
      emailVerified: new Date(),
    },
    select: { id: true, email: true },
  });

  console.log(`\nAdministrador creado: ${user.email}`);
  console.log(`Contraseña: ${password}`);
  console.log("\nGuardala ahora: no se muestra de nuevo y no queda en ningún lado.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
