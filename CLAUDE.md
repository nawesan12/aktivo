# Jiku

SaaS multi-tenant de turnos para negocios de servicios en Argentina.
Ver [`README.md`](./README.md) para levantar el proyecto y
[`ROADMAP.md`](./ROADMAP.md) para el estado.

## Antes de tocar código

- **La configuración se valida al arrancar.** Toda variable de entorno pasa por
  `src/lib/env.ts`. No agregues `process.env.X` suelto: sumalo al esquema. La
  excepción está documentada en `src/lib/cloudinary.ts` (las dos variables que
  también corren en el cliente).
- **Nada de `console.*`.** Usá `createLogger("scope")` de `src/lib/logger.ts`.
  En producción emite JSON por línea, que es lo que se puede filtrar después.
- **Los errores de API salen por `handleApiError(error, "scope")`.** No escribas
  un `NextResponse.json({ error: "..." }, { status: 500 })` a mano: se traga el
  status de los errores tipados y no registra nada.
- **El trabajo que sobrevive a la respuesta va en `runInBackground()`.** Un
  `promesa.catch(...)` suelto se pierde cuando la función serverless se suspende.
- **Un solo lugar por concepto:** moneda en `lib/format.ts`, teléfonos en
  `lib/phone.ts`, estados de turno en `lib/appointment-status.ts`. Si estás por
  escribir un `toLocaleString("es-AR")`, ya existe.

## Reglas del dominio

- Toda consulta se acota por `businessId`. Es multi-tenant: un `where` sin
  negocio es una fuga de datos entre clientes.
- La disponibilidad se calcula en la zona horaria del negocio
  (`lib/timezone.ts`). Nunca uses `new Date("YYYY-MM-DD")`: eso es medianoche
  UTC y en Argentina cae el día anterior.
- `POST /api/appointments` acepta la fecha con zona (instante absoluto) o sin
  ella (hora local del negocio). Los dos caminos están y hacen falta.
- La protección contra doble reserva vive en la base. Si tocás la creación de
  turnos, mantené la escritura dentro de la transacción y dejá que el 409 salga
  de `handleApiError`.

## Verificación

```bash
npx tsc --noEmit && npx eslint . && npx vitest run && npm run build
npx playwright test        # requiere la app levantada y el seed cargado
npx tsx scripts/e2e-cleanup.ts
```

El idioma del producto es español rioplatense (voseo), con acentos. Los
comentarios del código están en inglés.

@AGENTS.md
