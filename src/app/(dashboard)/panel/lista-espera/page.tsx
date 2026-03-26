import type { Metadata } from "next";
import { WaitlistManager } from "@/components/dashboard/waitlist-manager";

export const metadata: Metadata = {
  title: "Lista de espera | Jiku",
};

export default function ListaEsperaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Lista de espera</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona los clientes en lista de espera
        </p>
      </div>
      <WaitlistManager />
    </div>
  );
}
