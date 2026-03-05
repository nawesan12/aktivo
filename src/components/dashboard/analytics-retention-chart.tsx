"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RetentionData {
  month: string;
  totalClients: number;
  returningClients: number;
  retentionRate: number;
}

export function AnalyticsRetentionChart({ data }: { data: RetentionData[] }) {
  if (data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay datos suficientes</p>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Retención Mensual</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Porcentaje de clientes que regresan de un mes al siguiente.
      </p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} unit="%" />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#f4f4f5" }}
            />
            <Area
              type="monotone"
              dataKey="retentionRate"
              stroke="#6366F1"
              fill="url(#retentionGradient)"
              name="Retención %"
            />
            <defs>
              <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        {data.slice(-3).map((d) => (
          <div key={d.month} className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">{d.month}</p>
            <p className="text-lg font-bold">{d.retentionRate}%</p>
            <p className="text-xs text-muted-foreground">
              {d.returningClients}/{d.totalClients} clientes
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
