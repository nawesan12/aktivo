import { LocationsManager } from "@/components/dashboard/locations-manager";

export const metadata = {
  title: "Sucursales | Jiku",
};

export default function SucursalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sucursales</h1>
        <p className="text-muted-foreground">Gestiona tus ubicaciones y visualiza métricas cross-location</p>
      </div>
      <LocationsManager />
    </div>
  );
}
