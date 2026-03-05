"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LTVData {
  clients: {
    clientId: string;
    clientName: string;
    type: "registered" | "guest";
    totalRevenue: number;
    totalAppointments: number;
    monthsActive: number;
    ltv: number;
  }[];
  averageLTV: number;
}

export function AnalyticsLTVChart({ data }: { data: LTVData }) {
  if (data.clients.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay datos suficientes</p>;
  }

  const chartData = data.clients.slice(0, 10).map((c) => ({
    name: c.clientName.length > 12 ? c.clientName.slice(0, 12) + "…" : c.clientName,
    ltv: c.ltv,
    revenue: c.totalRevenue,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Client Lifetime Value</h3>
      <p className="text-sm text-muted-foreground mb-6">
        LTV promedio: <span className="font-semibold text-foreground">${data.averageLTV.toLocaleString("es-AR")}</span>/mes
      </p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis dataKey="name" type="category" width={100} tick={{ fill: "#a1a1aa", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
              formatter={(value) => [`$${Number(value).toLocaleString("es-AR")}`, "LTV/mes"]}
            />
            <Bar dataKey="ltv" fill="#22D3EE" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-2">Cliente</th>
              <th className="pb-2 text-right">Ingresos</th>
              <th className="pb-2 text-right">Turnos</th>
              <th className="pb-2 text-right">Meses</th>
              <th className="pb-2 text-right">LTV/mes</th>
            </tr>
          </thead>
          <tbody>
            {data.clients.slice(0, 10).map((c) => (
              <tr key={c.clientId} className="border-b border-border/50">
                <td className="py-2">{c.clientName}</td>
                <td className="py-2 text-right">${c.totalRevenue.toLocaleString("es-AR")}</td>
                <td className="py-2 text-right">{c.totalAppointments}</td>
                <td className="py-2 text-right">{c.monthsActive}</td>
                <td className="py-2 text-right font-medium">${c.ltv.toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
