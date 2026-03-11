"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Loader2, Tag, TicketPercent } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validUntil: string | null;
  isActive: boolean;
}

interface CouponsResponse {
  data: Coupon[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  stats: {
    total: number;
    totalRedemptions: number;
    active: number;
  };
}

const INITIAL_FORM = {
  code: "",
  type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
  value: "",
  minAmount: "",
  maxUses: "",
  validUntil: "",
};

export function CouponsDashboard() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<CouponsResponse>(
    `/api/panel/coupons?page=${page}&limit=20`
  );

  const handleCreate = async () => {
    if (!form.code.trim() || !form.value || submitting) return;
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
      };
      if (form.minAmount) body.minAmount = Number(form.minAmount);
      if (form.maxUses) body.maxUses = Number(form.maxUses);
      if (form.validUntil) body.validUntil = form.validUntil;

      const res = await fetch("/api/panel/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al crear el cupon");
        return;
      }

      toast.success("Cupon creado correctamente");
      setForm(INITIAL_FORM);
      setShowForm(false);
      mutate();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/panel/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(isActive ? "Cupon desactivado" : "Cupon activado");
      mutate();
    } catch {
      toast.error("Error al actualizar el cupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Estas seguro de que queres eliminar este cupon?")) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/panel/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Cupon eliminado");
      mutate();
    } catch {
      toast.error("Error al eliminar el cupon");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const coupons = data?.data || [];
  const stats = data?.stats || { total: 0, totalRedemptions: 0, active: 0 };
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground mt-1">Total cupones</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-3xl font-bold">{stats.totalRedemptions}</p>
          <p className="text-sm text-muted-foreground mt-1">Total canjes</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-3xl font-bold">{stats.active}</p>
          <p className="text-sm text-muted-foreground mt-1">Cupones activos</p>
        </div>
      </div>

      {/* Create button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl brand-gradient text-white"
        >
          <Plus className="w-4 h-4" />
          Crear cupon
        </button>
      )}

      {/* Create form */}
      {showForm && (
        <div className="glass rounded-xl p-6 space-y-4">
          <h3 className="text-base font-heading font-bold">Nuevo cupon</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Codigo</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Ej: VERANO2026"
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as "PERCENTAGE" | "FIXED" })
                }
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo ($)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Valor {form.type === "PERCENTAGE" ? "(%)" : "($)"}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "PERCENTAGE" ? "10" : "500"}
                min="0"
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Monto minimo (opcional)</label>
              <input
                type="number"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Usos maximos (opcional)</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Sin limite"
                min="1"
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Valido hasta (opcional)</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowForm(false);
                setForm(INITIAL_FORM);
              }}
              className="px-4 py-2 text-sm rounded-xl hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.code.trim() || !form.value || submitting}
              className="px-5 py-2 text-sm font-medium rounded-xl brand-gradient text-white disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear cupon
            </button>
          </div>
        </div>
      )}

      {/* Coupons list */}
      <div className="space-y-3">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {coupon.type === "PERCENTAGE" ? (
                    <TicketPercent className="w-4 h-4 text-primary" />
                  ) : (
                    <Tag className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">{coupon.code}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : `$${coupon.value}`}
                    </span>
                    {!coupon.isActive && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-500/10 text-zinc-400">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>
                      {coupon.usedCount}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ""} usos
                    </span>
                    {coupon.validUntil && (
                      <>
                        <span>·</span>
                        <span>
                          Hasta{" "}
                          {format(new Date(coupon.validUntil), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Toggle active */}
                <button
                  onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    coupon.isActive ? "bg-green-500" : "bg-zinc-600"
                  }`}
                  title={coupon.isActive ? "Desactivar" : "Activar"}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      coupon.isActive ? "left-5.5 translate-x-0.5" : "left-0.5"
                    }`}
                  />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(coupon.id)}
                  disabled={deletingId === coupon.id}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                  title="Eliminar"
                >
                  {deletingId === coupon.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {coupons.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No hay cupones creados</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
