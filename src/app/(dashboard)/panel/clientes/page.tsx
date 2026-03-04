import type { Metadata } from "next";
import { ClientsList } from "@/components/dashboard/clients-list";

export const metadata: Metadata = {
  title: "Clientes",
};

export default function ClientesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Base de datos de clientes y CRM
        </p>
      </div>
      <ClientsList />
    </div>
  );
}
