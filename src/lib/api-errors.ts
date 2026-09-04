import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createLogger } from "@/lib/logger";

const log = createLogger("api");

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends AppError {
  constructor(message = "No autenticado") {
    super(message, 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Permisos insuficientes") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "No encontrado") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos inválidos") {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

/**
 * Someone else got the slot first.
 *
 * There are two ways to find that out — the availability check reads it as
 * taken, or the database rejects the insert — and they used to answer
 * differently: one a plain 409 with its own wording, the other a 409 with a
 * `SLOT_TAKEN` code. Same situation, two shapes, and a client that could only
 * recognise one of them.
 */
export class SlotTakenError extends AppError {
  constructor() {
    super("Ese horario acaba de ser reservado. Elegí otro, por favor.", 409);
    this.name = "SlotTakenError";
  }
}

/**
 * The trial ran out and nobody subscribed. 402 rather than 403: it is not a
 * permissions problem, and the interface has to tell them apart — one sends the
 * user to the payment screen, the other means they should not be here at all.
 */
export class SubscriptionRequiredError extends AppError {
  constructor(message = "Tu prueba gratis terminó. Suscribite para seguir operando.") {
    super(message, 402);
    this.name = "SubscriptionRequiredError";
  }
}

export class PlanLimitError extends AppError {
  constructor(
    message = "Tu plan actual no incluye esta funcionalidad",
    public requiredPlan: string = "PROFESSIONAL"
  ) {
    super(message, 403);
    this.name = "PlanLimitError";
  }
}


/**
 * True when the database rejected a booking because it overlaps an existing one.
 * Postgres reports this as SQLSTATE 23P01 (exclusion_violation); Prisma surfaces
 * the driver message, so both the code and the constraint name are checked.
 */
export function isSlotTakenError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const code = (error as { code?: unknown }).code;
  if (code === "23P01") return true;

  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Appointment_no_overlap_per_staff") ||
    message.includes("exclusion constraint")
  );
}

/**
 * Single exit point for a failed request.
 *
 * `scope` names the operation (`account:profile:PATCH`) so the log line is
 * searchable. It replaces the per-route `console.error("X error:", error)` that
 * used to sit next to a hand-written 500 — which also swallowed the status code
 * of every typed error thrown underneath.
 */
export function handleApiError(error: unknown, scope?: string): NextResponse {
  if (error instanceof PlanLimitError) {
    return NextResponse.json(
      { error: error.message, requiredPlan: error.requiredPlan, code: "PLAN_LIMIT" },
      { status: error.statusCode }
    );
  }

  if (error instanceof SubscriptionRequiredError) {
    return NextResponse.json(
      { error: error.message, code: "SUBSCRIPTION_REQUIRED" },
      { status: error.statusCode }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Two clients raced for the same slot: either the availability check saw it
  // gone, or the database rejected the loser (exclusion constraint
  // "Appointment_no_overlap_per_staff").
  if (error instanceof SlotTakenError || isSlotTakenError(error)) {
    return NextResponse.json(
      {
        error: "Ese horario acaba de ser reservado. Elegí otro, por favor.",
        code: "SLOT_TAKEN",
      },
      { status: 409 }
    );
  }

  // A schema rejected the body. Without this, `schema.parse()` anywhere in a
  // route produced "Error interno" with a 500 — the caller was told the server
  // broke when in fact they had sent an invalid field, and the message
  // explaining which one was thrown away.
  if (error instanceof ZodError) {
    // The first issue's message only, matching what every hand-rolled
    // `safeParse` branch in the routes already returns. The field name stays
    // out of it: they are English identifiers and the product speaks Spanish.
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Datos inválidos", code: "VALIDATION" },
      { status: 400 }
    );
  }

  // Prisma unique constraint
  if (
    error instanceof Error &&
    error.message.includes("Unique constraint")
  ) {
    return NextResponse.json(
      { error: "El registro ya existe" },
      { status: 409 }
    );
  }

  // Prisma not found
  if (
    error instanceof Error &&
    error.message.includes("Record to delete does not exist")
  ) {
    return NextResponse.json(
      { error: "Registro no encontrado" },
      { status: 404 }
    );
  }

  (scope ? log.child(scope) : log).error("unhandled error", error);
  return NextResponse.json(
    { error: "Error interno" },
    { status: 500 }
  );
}
