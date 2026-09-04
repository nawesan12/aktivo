import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CheckCircle, XCircle } from "lucide-react";

/**
 * Kept in sync with the schema in `src/lib/env.ts`. A row here for a variable
 * that no longer exists is worse than no row at all: it reads as a broken
 * integration forever.
 */
const envVars = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "GUEST_JWT_SECRET",
  "ENCRYPTION_KEY",
  "CRON_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "MERCADOPAGO_ACCESS_TOKEN",
  "MERCADOPAGO_WEBHOOK_SECRET",
  "MP_PLATFORM_ACCESS_TOKEN",
  "MP_CLIENT_ID",
  "MP_CLIENT_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
];

export default async function AdminSystemPage() {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "PLATFORM_ADMIN") {
    redirect("/panel");
  }

  // DB check
  let dbConnected = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Sistema</h1>
        <p className="text-muted-foreground text-sm mt-1">Estado del sistema y variables de entorno</p>
      </div>

      {/* DB status */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-heading font-semibold text-sm mb-3">Base de datos</h3>
        <div className="flex items-center gap-2">
          {dbConnected ? (
            <>
              <CheckCircle className="w-5 h-5 text-success-foreground" />
              <span className="text-sm text-success-foreground">Conectada</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-danger-foreground" />
              <span className="text-sm text-danger-foreground">Sin conexión</span>
            </>
          )}
        </div>
      </div>

      {/* Environment variables */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm">Variables de entorno</h3>
        </div>
        <div className="divide-y divide-border/50">
          {envVars.map((key) => {
            const isSet = !!process.env[key];
            return (
              <div key={key} className="px-4 py-2.5 flex items-center justify-between">
                <code className="text-xs font-mono text-muted-foreground">{key}</code>
                {isSet ? (
                  <span className="text-xs text-success-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Configurada
                  </span>
                ) : (
                  <span className="text-xs text-neutral-foreground flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> No configurada
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
