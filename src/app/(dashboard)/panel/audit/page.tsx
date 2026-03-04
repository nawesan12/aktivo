import type { Metadata } from "next";
import { AuditLog } from "@/components/dashboard/audit-log";

export const metadata: Metadata = {
  title: "Audit Log",
};

export default function AuditPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de actividad y cambios
        </p>
      </div>
      <AuditLog />
    </div>
  );
}
