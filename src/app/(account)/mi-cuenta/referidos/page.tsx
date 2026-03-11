"use client";

import { useState } from "react";
import useSWR from "swr";
import { Users, Copy, Check, Share2, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";

export default function ReferralsPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch user businesses
  const { data: businesses } = useSWR("/api/account/businesses");
  const businessList = businesses?.data || businesses || [];

  // Select first business if none selected
  if (!selectedBusiness && businessList.length > 0) {
    setSelectedBusiness(businessList[0].slug || businessList[0].business?.slug);
  }

  const slug = selectedBusiness;
  const { data: referral, mutate } = useSWR(
    slug ? `/api/businesses/${slug}/referrals` : null
  );

  const generateCode = async () => {
    if (!slug) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/businesses/${slug}/referrals`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("Código de referido generado");
      mutate();
    } catch {
      toast.error("Error al generar código");
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    if (!referral?.code || !slug) return;
    const link = `${window.location.origin}/${slug}/reservar?ref=${referral.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (!referral?.code || !slug) return;
    const link = `${window.location.origin}/${slug}/reservar?ref=${referral.code}`;
    if (navigator.share) {
      navigator.share({ title: "Reservá un turno", url: link }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Programa de Referidos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compartí tu código y referí nuevos clientes
        </p>
      </div>

      {businessList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {businessList.map((b: Record<string, unknown>) => {
            const bSlug = (b.slug || (b.business as Record<string, unknown>)?.slug) as string;
            const bName = (b.name || (b.business as Record<string, unknown>)?.name) as string;
            return (
              <button
                key={bSlug}
                onClick={() => setSelectedBusiness(bSlug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedBusiness === bSlug
                    ? "brand-gradient text-white"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                {bName}
              </button>
            );
          })}
        </div>
      )}

      {!referral || !referral.code ? (
        <div className="glass rounded-xl p-12 text-center">
          <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm mb-4">
            Generá tu código de referido para compartir con amigos
          </p>
          <button
            onClick={generateCode}
            disabled={generating || !slug}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Generar código
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Code card */}
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Tu código de referido</p>
            <p className="text-3xl font-heading font-bold tracking-widest brand-text mb-4">
              {referral.code}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado" : "Copiar link"}
              </button>
              <button
                onClick={shareLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="glass rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-heading font-bold">{referral.totalReferrals || 0}</p>
                <p className="text-sm text-muted-foreground">Referidos totales</p>
              </div>
              <div>
                <p className="text-2xl font-heading font-bold">{referral.totalReferrals || 0}</p>
                <p className="text-sm text-muted-foreground">Reservas realizadas</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
