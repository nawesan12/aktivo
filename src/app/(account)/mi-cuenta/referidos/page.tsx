"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Users, Copy, Check, Share2, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { messageOf } from "@/lib/api-message";

interface ReferralBusiness {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  rewardType: "PERCENTAGE" | "FIXED" | null;
  rewardValue: number | null;
}

/** What the friend gets, said out loud instead of left to guess. */
function rewardLabel(business: ReferralBusiness | undefined) {
  if (!business?.rewardValue || !business.rewardType) return null;
  return business.rewardType === "PERCENTAGE"
    ? `${business.rewardValue}% de descuento`
    : `${formatCurrency(business.rewardValue)} de descuento`;
}

export default function ReferralsPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: businessesData, isLoading: loadingBusinesses } =
    useSWR("/api/account/businesses");
  const businessList: ReferralBusiness[] = businessesData?.data ?? [];

  // Falling back to the first business instead of setting state during render,
  // which React warns about and which fought the user's own choice.
  const slug = selectedSlug ?? businessList[0]?.slug ?? null;
  const business = businessList.find((b) => b.slug === slug);

  const { data: referralData, mutate } = useSWR(
    slug ? `/api/businesses/${slug}/referrals` : null
  );
  // The route answers { data: … }; the page used to read the code off the
  // envelope, so a generated code never showed up.
  const referral: { code: string; totalReferrals: number } | null =
    referralData?.data ?? null;

  const link =
    referral && slug
      ? `${window.location.origin}/${slug}/reservar?ref=${referral.code}`
      : null;

  const generateCode = async () => {
    if (!slug) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/businesses/${slug}/referrals`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Código de referido generado");
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos generar el código"));
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (!link) return;
    if (navigator.share) {
      navigator.share({ title: "Reservá un turno", url: link }).catch(() => {});
    } else {
      copyLink();
    }
  };

  const reward = rewardLabel(business);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Referí a un amigo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pasales tu link. Cuando reservan, les hacen un descuento.
        </p>
      </div>

      {loadingBusinesses ? (
        <div className="glass rounded-xl p-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : businessList.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-heading font-semibold">Todavía no hay nada para referir</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
            Los códigos son de cada negocio. Cuando reserves en uno que tenga
            programa de referidos, te va a aparecer acá.
          </p>
          <Link
            href="/explorar"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            Buscar un negocio
          </Link>
        </div>
      ) : (
        <>
          {businessList.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {businessList.map((b) => (
                <button
                  key={b.slug}
                  onClick={() => setSelectedSlug(b.slug)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    slug === b.slug
                      ? "brand-gradient text-white"
                      : "glass text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}

          {!referral ? (
            <div className="glass rounded-xl p-12 text-center">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
                {reward
                  ? `Generá tu código de ${business?.name}: quien lo use se lleva ${reward} en su primer turno.`
                  : `Generá tu código de ${business?.name} para compartir con amigos.`}
              </p>
              <button
                onClick={generateCode}
                disabled={generating}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                Generar código
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Tu código de {business?.name}
                </p>
                <p className="text-3xl font-heading font-bold tracking-widest brand-text mb-4">
                  {referral.code}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={copyLink}
                    aria-label="Copiar el link de referido"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success-foreground" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
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

              {/* One number, said once. The card used to print the same count
                  under two different labels, as if they were two figures. */}
              <div className="glass rounded-xl p-6 text-center">
                <p className="text-3xl font-heading font-bold">{referral.totalReferrals}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {referral.totalReferrals === 1
                    ? "persona reservó con tu código"
                    : "personas reservaron con tu código"}
                </p>
                {reward && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Cada una se llevó {reward}.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
