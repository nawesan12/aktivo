"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { PLAN_NAMES } from "@/lib/subscription/config";


// The same names the pricing page and the subscription screen use. This file
// had a third set — "Starter"/"Professional"/"Enterprise" — so the plan a
// person was on depended on which screen they were looking at.
const planLabels: Record<string, string> = PLAN_NAMES;

const roleLabels: Record<string, string> = {
  BUSINESS_OWNER: "Propietario",
  BUSINESS_MANAGER: "Manager",
  STAFF_MEMBER: "Staff",
  RECEPTIONIST: "Recepcionista",
};

export default function BusinessesPage() {
  const { data, isLoading } = useSWR("/api/account/profile");
  const { update: updateSession } = useSession();
  const [switching, setSwitching] = useState<string | null>(null);

  async function enter(businessId: string) {
    setSwitching(businessId);
    try {
      const res = await fetch("/api/panel/switch-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      // The token carries the active business; without rewriting it the panel
      // opens on whichever one it already had.
      await updateSession({ businessId });

      // A full load, not a client-side navigation: the panel is rendered on the
      // server from the session's business, and a soft push would show the
      // cached render of the branch we just left.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/panel";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos entrar a ese negocio");
      setSwitching(null);
    }
  }

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
                {/*
                  Switches the session to this business before going in. Every
                  card used to link straight to /panel, so clicking "Barbería
                  Sur" landed you in "Barbería Norte" with no explanation.
                */}
                <button
                  type="button"
                  onClick={() => enter(biz.id)}
                  disabled={switching !== null}
                  className="flex-1 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {switching === biz.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      Ir al panel <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
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
