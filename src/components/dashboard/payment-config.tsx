"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, CreditCard, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { paymentConfigSchema, type PaymentConfigInput } from "@/lib/validations";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { PermissionGate } from "@/components/auth/permission-gate";
import { formatCurrency } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";


export function PaymentConfig() {
  const { data, isLoading, mutate } = useSWR("/api/panel/payments/config");
  const { data: paymentsData, mutate: mutatePayments } = useSWR("/api/panel/payments");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  // A refund moves real money: it deserves a dialog the browser cannot
  // suppress, which `window.confirm` is not.
  const [pendingRefund, setPendingRefund] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentConfigInput>({
    resolver: zodResolver(paymentConfigSchema),
  });

  const paymentMode = watch("paymentMode");

  useEffect(() => {
    if (data) {
      reset({
        paymentMode: data.paymentMode || "DISABLED",
        depositPercentage: data.depositPercentage || 50,
        depositFixedAmount: data.depositFixedAmount || 0,
        });
      setCancellationPolicy(data.cancellationPolicy || "");
    }
  }, [data, reset]);

  async function onSubmit(formData: PaymentConfigInput) {
    try {
      const res = await fetch("/api/panel/payments/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, cancellationPolicy }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Configuración de pagos guardada");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  async function handleRefund(paymentId: string) {
    setPendingRefund(null);
    setRefundingId(paymentId);
    try {
      const res = await fetch(`/api/panel/payments/${paymentId}/refund`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Pago reembolsado correctamente");
      mutatePayments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al reembolsar");
    } finally {
      setRefundingId(null);
    }
  }

  if (isLoading) return <FormSkeleton />;

  const payments = paymentsData?.data || [];

  const statusLabels: Record<string, { label: string; className: string }> = {
    APPROVED: { label: "Aprobado", className: "bg-success-muted text-success-foreground border-success/20" },
    PENDING: { label: "Pendiente", className: "bg-warning-muted text-warning-foreground border-warning/20" },
    REFUNDED: { label: "Reembolsado", className: "bg-info-muted text-info-foreground border-info/20" },
    REJECTED: { label: "Rechazado", className: "bg-danger-muted text-danger-foreground border-danger/20" },
    CANCELLED: { label: "Cancelado", className: "bg-neutral-muted text-neutral-foreground border-neutral/20" },
    IN_PROCESS: { label: "En proceso", className: "bg-warning-muted text-warning-foreground border-warning/20" },
  };

  return (
    <div className="space-y-6">
    <ConfirmDialog
      open={pendingRefund !== null}
      onOpenChange={(open) => !open && setPendingRefund(null)}
      title="Reembolsar el pago"
      description="Se devuelve el dinero al cliente y el turno queda cancelado. No se puede deshacer."
      confirmLabel="Reembolsar"
      destructive
      onConfirm={() => pendingRefund && handleRefund(pendingRefund)}
    />
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Payment mode */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Modo de pago
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { value: "DISABLED", label: "Deshabilitado", desc: "Sin cobro online" },
            { value: "FULL", label: "Pago total", desc: "Cobrar el total del servicio" },
            { value: "PERCENTAGE", label: "Porcentaje", desc: "Cobrar un porcentaje como seña" },
            { value: "FIXED", label: "Monto fijo", desc: "Cobrar un monto fijo como seña" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                paymentMode === opt.value
                  ? "border-primary/30 bg-primary/5"
                  : "border-border hover:bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  {...register("paymentMode")}
                  value={opt.value}
                  className="text-primary"
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">{opt.desc}</p>
            </label>
          ))}
        </div>

        {paymentMode === "PERCENTAGE" && (
          <div>
            <label htmlFor="depositPercentage" className="text-sm font-medium mb-1.5 block">Porcentaje de seña (%)</label>
            <input
              id="depositPercentage"
              {...register("depositPercentage", { valueAsNumber: true })}
              type="number"
              min={1}
              max={100}
              className="w-full max-w-xs h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.depositPercentage && (
              <p className="text-xs text-destructive mt-1">{errors.depositPercentage.message}</p>
            )}
          </div>
        )}

        {paymentMode === "FIXED" && (
          <div>
            <label htmlFor="depositFixedAmount" className="text-sm font-medium mb-1.5 block">Monto fijo ($)</label>
            <input
              id="depositFixedAmount"
              {...register("depositFixedAmount", { valueAsNumber: true })}
              type="number"
              min={0}
              step={100}
              className="w-full max-w-xs h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.depositFixedAmount && (
              <p className="text-xs text-destructive mt-1">{errors.depositFixedAmount.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Cancellation policy */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold">Política de cancelación</h3>
        <textarea
          value={cancellationPolicy}
          onChange={(e) => setCancellationPolicy(e.target.value)}
          rows={4}
          placeholder="Describe tu política de cancelación y reembolsos..."
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar configuración
        </button>
      </div>
    </form>

    {/* Payment history */}
    {payments.length > 0 && (
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm">Historial de pagos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Servicio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: Record<string, unknown>) => {
                const appt = p.appointment as Record<string, unknown> | null;
                const clientName = (appt?.user as Record<string, unknown>)?.name
                  || (appt?.guestClient as Record<string, unknown>)?.name
                  || "—";
                const serviceName = (appt?.service as Record<string, unknown>)?.name || "—";
                const status = statusLabels[p.status as string] || { label: p.status as string, className: "bg-muted text-muted-foreground" };
                return (
                  <tr key={p.id as string} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{clientName as string}</td>
                    <td className="px-4 py-3 text-muted-foreground">{serviceName as string}</td>
                    <td className="px-4 py-3">{formatCurrency(p.amount as number)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(p.createdAt as string), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "APPROVED" && (
                        <PermissionGate permission="payments:configure">
                          <button
                            onClick={() => setPendingRefund(p.id as string)}
                            disabled={refundingId === p.id}
                            className="text-xs px-2.5 py-1 rounded-lg border border-danger/20 text-danger-foreground hover:bg-danger-muted disabled:opacity-50 flex items-center gap-1"
                          >
                            {refundingId === p.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            Reembolsar
                          </button>
                        </PermissionGate>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
    </div>
  );
}
