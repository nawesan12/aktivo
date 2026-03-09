import { NextResponse } from "next/server";

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

export class PlanLimitError extends AppError {
  constructor(
    message = "Tu plan actual no incluye esta funcionalidad",
    public requiredPlan: string = "PROFESSIONAL"
  ) {
    super(message, 403);
    this.name = "PlanLimitError";
  }
}


export function handleApiError(error: unknown): NextResponse {
  if (error instanceof PlanLimitError) {
    return NextResponse.json(
      { error: error.message, requiredPlan: error.requiredPlan, code: "PLAN_LIMIT" },
      { status: error.statusCode }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
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

  console.error("Unhandled error:", error);
  return NextResponse.json(
    { error: "Error interno" },
    { status: 500 }
  );
}
