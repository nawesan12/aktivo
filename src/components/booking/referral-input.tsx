"use client";

import { useState } from "react";
import { Users, Check, Loader2 } from "lucide-react";
import { useBookingStore } from "@/stores/booking-store";

interface ReferralInputProps {
  slug: string;
}

export function ReferralInput({ slug }: ReferralInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const { setReferralCode, referralCode } = useBookingStore();

  const handleApply = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/businesses/${slug}/referrals/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Código de referido inválido");
        setLoading(false);
        return;
      }

      setReferralCode(code.trim());
      setApplied(true);
    } catch {
      setError("Error al validar el código");
    } finally {
      setLoading(false);
    }
  };

  // Sync from store if already set
  if (referralCode && !applied) {
    setCode(referralCode);
    setApplied(true);
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users className="w-4 h-4" />
        Codigo de referido
      </div>

      {applied ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-success-muted flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-success-foreground" />
          </div>
          <p className="text-sm text-success-foreground">Código de referido aplicado</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder="Escribí el código"
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
  );
}
