"use client";

import useSWR from "swr";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const planLabels: Record<string, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

const roleLabels: Record<string, string> = {
  BUSINESS_OWNER: "Propietario",
  BUSINESS_MANAGER: "Manager",
  STAFF_MEMBER: "Staff",
  RECEPTIONIST: "Recepcionista",
};

export default function BusinessesPage() {
  const { data, isLoading } = useSWR("/api/account/profile", fetcher);

  if (isLoading) return <FormSkeleton />;

  const businesses = data?.businesses || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Negocios</h1>
        <p className="text-muted-foreground text-sm mt-1">Negocios asociados a tu cuenta</p>
      </div>

      {businesses.length === 0 ? (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center">
          <Building2 className="w-10 h-10 mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No tenes negocios asociados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map((biz: Record<string, string>) => (
            <div key={biz.id} className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {biz.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{biz.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {planLabels[biz.plan] || biz.plan}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      {roleLabels[biz.role] || biz.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href="/panel"
                  className="flex-1 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1"
                >
                  Ir al panel <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/${biz.slug}`}
                  className="flex-1 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center"
                >
                  Ver perfil
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
