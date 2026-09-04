# Migraciones

El proyecto venía manejándose con `prisma db push`, sin historial. La primera
migración de esta carpeta es un *baseline*: refleja el schema tal como estaba en
la base antes de que existiera este historial.

Eso hace que aplicar las migraciones dependa de contra qué base estés parado, y
la diferencia importa mucho.

## Base nueva y vacía (producción)

```bash
npx prisma migrate deploy
```

Nada más. **No corras `migrate resolve --applied 00000000000000_init`**: eso
marcaría el baseline como aplicado *sin ejecutarlo*, y la base quedaría sin una
sola tabla mientras Prisma cree que está al día. Es un error silencioso y
difícil de ver hasta que la aplicación arranca y falla contra tablas que no
existen.

Dos detalles del entorno:

- Apuntá a la URL **no pooleada** (`DATABASE_URL_UNPOOLED` en la integración de
  Neon). El pooler no soporta el DDL transaccional que usan las migraciones.
- El build **no** corre migraciones: `npm run build` es `prisma generate && next
  build`. Aplicarlas es un paso aparte del despliegue.

## Base que ya venía de `db push`

Sólo si la base tiene las tablas pero no la tabla `_prisma_migrations`:

```bash
npx prisma migrate resolve --applied 00000000000000_init
npx prisma migrate deploy
```

Antes del segundo comando conviene verificar que no haya turnos solapados
preexistentes, porque la constraint de exclusión falla si los hay:

```sql
SELECT a.id, b.id, a."staffId", a."dateTime", a."endTime", b."dateTime", b."endTime"
FROM "Appointment" a
JOIN "Appointment" b
  ON a."staffId" = b."staffId"
 AND a.id < b.id
 AND tsrange(a."dateTime", a."endTime", '[)') && tsrange(b."dateTime", b."endTime", '[)')
WHERE a.status IN ('PENDING_PAYMENT','PENDING','CONFIRMED')
  AND b.status IN ('PENDING_PAYMENT','PENDING','CONFIRMED');
```

Si devuelve filas hay que resolverlas —cancelar o reprogramar una de cada par—
antes de continuar. Que aparezcan no sería raro: son justamente los turnos que
el bug de solapamiento permitía crear.

## El seed no va a producción

`prisma/seed.ts` crea dos barberías falsas y un usuario `admin@jiku.app` con la
contraseña `admin123`, que está publicada en este repositorio. Para el
administrador de plataforma real:

```bash
npx tsx scripts/create-admin.ts admin@jikuapp.com "Nombre Apellido"
```

## Sobre la constraint de exclusión

`Appointment_no_overlap_per_staff` usa `EXCLUDE USING gist` sobre el rango
`[dateTime, endTime)` y requiere la extensión `btree_gist` (disponible en Neon;
la migración la crea si falta).

Es la red de seguridad real contra la doble reserva: la verificación de
disponibilidad en la aplicación es un *check-then-act* y dos requests
simultáneos pueden pasarla ambos. La constraint hace que el perdedor de esa
carrera falle en la base, y `handleApiError()` traduce ese error a un **409
`SLOT_TAKEN`**.

Lo que la constraint **no** puede ver es el tiempo: el `WHERE` de un índice
parcial exige funciones `IMMUTABLE` y `now()` no lo es, así que `expiresAt` no
puede aparecer ahí. Una reserva impaga vencida sigue ocupando el slot para la
base aunque la aplicación ya la ignore. Por eso existe `releaseExpiredHolds()`
(`src/lib/bookings/expiry.ts`), que se llama en los tres caminos que insertan un
turno: sin eso, un slot con una reserva vencida se ve libre y falla para siempre.

El *buffer* entre turnos tampoco está en la constraint —es configuración por
negocio y puede cambiar— así que sigue siendo una regla de aplicación, en
`computeSlotsForDay`.
