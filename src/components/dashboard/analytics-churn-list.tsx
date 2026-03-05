"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Mail, Phone } from "lucide-react";

interface ChurnData {
  atRiskClients: {
    clientId: string;
    clientName: string;
    type: "registered" | "guest";
    email: string | null;
    phone: string | null;
    lastVisit: string;
    daysSinceLastVisit: number;
    totalAppointments: number;
  }[];
  totalAtRisk: number;
}

export function AnalyticsChurnList({ data }: { data: ChurnData }) {
  if (data.atRiskClients.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">No hay clientes en riesgo de churn</p>
      </div>
    );
  }

  function getRiskLevel(days: number): { label: string; color: string } {
    if (days >= 60) return { label: "Alto", color: "text-red-500 bg-red-500/10" };
    if (days >= 45) return { label: "Medio", color: "text-orange-500 bg-orange-500/10" };
    return { label: "Bajo", color: "text-yellow-500 bg-yellow-500/10" };
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Clientes en Riesgo</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {data.totalAtRisk} clientes sin actividad en los últimos 30 días.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-2">Cliente</th>
              <th className="pb-2">Última Visita</th>
              <th className="pb-2 text-right">Días</th>
              <th className="pb-2 text-right">Turnos</th>
              <th className="pb-2">Riesgo</th>
              <th className="pb-2">Contacto</th>
            </tr>
          </thead>
          <tbody>
            {data.atRiskClients.map((client) => {
              const risk = getRiskLevel(client.daysSinceLastVisit);
              return (
                <tr key={client.clientId} className="border-b border-border/50">
                  <td className="py-2.5">
                    <div>
                      <p className="font-medium">{client.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.type === "registered" ? "Registrado" : "Guest"}
                      </p>
                    </div>
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {format(new Date(client.lastVisit), "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="py-2.5 text-right font-medium">
                    {client.daysSinceLastVisit}d
                  </td>
                  <td className="py-2.5 text-right">{client.totalAppointments}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${risk.color}`}>
                      {risk.label}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      {client.email && (
                        <a href={`mailto:${client.email}`} className="text-muted-foreground hover:text-primary">
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {client.phone && (
                        <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} className="text-muted-foreground hover:text-emerald-500">
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
