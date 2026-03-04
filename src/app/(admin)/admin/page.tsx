"use client";

import useSWR from "swr";
import { Building2, Users, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR("/api/admin/stats", fetcher);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Vista general de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Negocios" value={data?.totalBusinesses?.toString() || "0"} change="Total" icon={Building2} trend="neutral" />
        <KpiCard label="Usuarios" value={data?.totalUsers?.toString() || "0"} change="Total" icon={Users} trend="neutral" />
        <KpiCard label="Turnos este mes" value={data?.appointmentsThisMonth?.toString() || "0"} change="Este mes" icon={Calendar} trend="neutral" />
        <KpiCard label="Ingresos este mes" value={`$${(data?.revenueThisMonth || 0).toLocaleString("es-AR")}`} change="Pagos aprobados" icon={DollarSign} trend="neutral" />
      </div>

      {/* Recent businesses */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm">Negocios recientes</h3>
        </div>
        <div className="divide-y divide-border/50">
          {(data?.recentBusinesses || []).map((biz: Record<string, unknown>) => (
            <div key={biz.id as string} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{biz.name as string}</p>
                <p className="text-xs text-muted-foreground">/{biz.slug as string}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {biz.plan as string}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(biz.createdAt as string), "d MMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
