# Migraciones

El proyecto venía manejándose con `prisma db push`, sin historial. Estas migraciones
introducen ese historial **sin perder datos**, mediante un *baseline*.

> ⚠️ Ninguna de estas migraciones fue aplicada todavía a la base de Neon.

## Qué hay acá

| Migración | Estado esperado | Qué hace |
|---|---|---|
| `00000000000000_init` | **Ya aplicada de hecho** (baseline) | Refleja el schema tal como estaba en la base antes de estos cambios. No hay que ejecutarla: la base ya tiene ese estado por `db push`. |
| `20260828000000_booking_integrity` | Pendiente | Agrega `Appointment.expiresAt`, un índice sobre `guestClientId` y la constraint que impide el doble booking. |

## Cómo aplicarlas

**1. Marcar el baseline como ya aplicado** (no ejecuta SQL, solo registra):

```bash
npx prisma migrate resolve --applied 00000000000000_init
```

**2. Antes de la segunda migración, verificar que no haya solapamientos previos.**
La constraint falla si ya existen turnos superpuestos. Esta consulta los lista:

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

Si devuelve filas, hay que resolverlas (cancelar o reprogramar una de cada par) antes de continuar.
Que aparezcan filas no sería raro: son justamente los turnos que el bug de solapamiento
permitía crear.

**3. Aplicar:**

```bash
npx prisma migrate deploy
```

## Sobre la constraint de exclusión

`Appointment_no_overlap_per_staff` usa `EXCLUDE USING gist` sobre el rango
`[dateTime, endTime)` y requiere la extensión `btree_gist` (disponible en Neon; la
migración la crea si falta).

Es la red de seguridad real contra la doble reserva: la verificación de disponibilidad
en la aplicación es un *check-then-act* y dos requests simultáneos pueden pasarla ambos.
La constraint hace que el perdedor de esa carrera falle en la base. `handleApiError()`
traduce ese error a un **409 `SLOT_TAKEN`** con un mensaje entendible para el cliente.

El *buffer* entre turnos no está en la constraint —es configuración por negocio y puede
cambiar— así que sigue siendo una regla de aplicación, en `computeSlotsForDay`.
