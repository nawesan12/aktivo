import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BusinessSettings } from "@/components/dashboard/business-settings";
import { CustomDomain } from "@/components/dashboard/custom-domain";
import { PaymentConfig } from "@/components/dashboard/payment-config";
import { LocationsManager } from "@/components/dashboard/locations-manager";
import { NotificationsLog } from "@/components/dashboard/notifications-log";
import { DailyDigestSetting } from "@/components/dashboard/daily-digest-setting";
import { AuditLog } from "@/components/dashboard/audit-log";
import { NoShowTracker } from "@/components/dashboard/no-show-tracker";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import {
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "@/components/dashboard/settings-sections";

export const metadata: Metadata = {
  title: "Configuración",
};

interface Props {
  searchParams: Promise<{ s?: string }>;
}

/**
 * Everything about how the shop is set up, behind one entry in the sidebar.
 *
 * Sucursales, Envíos and Historial used to be three separate rows in a
 * twenty-four-item sidebar — screens an owner opens once a quarter, sitting at
 * the same weight as the agenda. They are sections in here now.
 */
export default async function ConfiguracionPage({ searchParams }: Props) {
  const { s } = await searchParams;
  const active = (SETTINGS_SECTIONS.some((section) => section.id === s)
    ? s
    : "negocio") as SettingsSection;

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      {/* min-w-0: on a phone the nav is a horizontal scroller, and without this
          its 760px of buttons set the column's width instead of scrolling. */}
      <div className="min-w-0">
        <h1 className="mb-4 text-[20px] font-bold tracking-[-0.025em]">Configuración</h1>
        <Suspense fallback={null}>
          <SettingsNav active={active} />
        </Suspense>
        <Link
          href="/panel/suscripcion"
          className="mt-1 block rounded-lg px-3 py-2.5 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-muted"
        >
          Suscripción →
        </Link>
      </div>

      <div className="min-w-0 space-y-3">
        {active === "negocio" && (
          <>
            <BusinessSettings section="negocio" />
            <CustomDomain />
          </>
        )}

        {active === "reservas" && (
          <>
            <BusinessSettings section="reservas" />
            <PaymentConfig />
          </>
        )}

        {active === "avisos" && (
          <>
            <DailyDigestSetting />
            <NotificationsLog />
          </>
        )}

        {active === "cancelaciones" && <NoShowTracker />}

        {active === "sucursales" && (
          <PlanGate feature="Multi-sucursal" requiredPlan="ENTERPRISE">
            <LocationsManager />
          </PlanGate>
        )}

        {active === "historial" && <AuditLog />}
      </div>
    </div>
  );
}
