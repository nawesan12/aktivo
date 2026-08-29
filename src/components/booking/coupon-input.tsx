"use client";

import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { useBookingStore } from "@/stores/booking-store";

interface CouponInputProps {
  slug: string;
  serviceId: string;
}

export function CouponInput({ slug, serviceId }: CouponInputProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [discountLabel, setDiscountLabel] = useState<string | null>(null);

  const { servicePrice, setCoupon, couponCode } = useBookingStore();

  const handleApply = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/businesses/${slug}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), serviceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Cupón inválido");
        setLoading(false);
        return;
      }

      let discount = 0;
      if (data.type === "PERCENTAGE") {
        discount = (servicePrice || 0) * data.value / 100;
        setDiscountLabel(`${data.value}% de descuento`);
      } else {
        discount = data.value;
        setDiscountLabel(`$${data.value} de descuento`);
      }

      setCoupon(code.trim().toUpperCase(), discount);
      setApplied(true);
    } catch {
      setError("Error al validar el cupón");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCoupon(null, null);
    setApplied(false);
    setCode("");
    setDiscountLabel(null);
    setError(null);
  };

  // If coupon was already applied from store
  if (couponCode && !applied) {
    setCode(couponCode);
    setApplied(true);
  }

  return (
    <div className="space-y-2">
      {!open && !applied && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Tag className="w-4 h-4" />
          Tenes un cupon?
        </button>
      )}

      {(open || applied) && (
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Tag className="w-4 h-4" />
            Cupon de descuento
          </div>

          {applied ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-success-muted flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-success-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-success-foreground">{code.toUpperCase()}</p>
                  {discountLabel && (
                    <p className="text-xs text-success-foreground/80">{discountLabel}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemove}
                aria-label="Quitar el cupón"
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="Ingresa tu código"
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleApply}
                  disabled={!code.trim() || loading}
                  className="px-4 py-2 text-sm font-medium rounded-lg brand-gradient text-white disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Aplicar
                </button>
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
