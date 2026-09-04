"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CheckCircle, AlertTriangle, Link2, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Connection {
  available: boolean;
  status: "none" | "broken" | "expired" | "ok";
  account: {
    mpUserId: string;
    expiresAt: string | null;
    connectedAt: string;
    lastError: string | null;
  } | null;
}

/** What the callback puts in the URL after the owner comes back from MercadoPago. */
const CALLBACK_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: "Mercado Pago quedó conectado" },
  denied: { ok: false, text: "No autorizaste la conexión" },
  invalid: { ok: false, text: "El enlace venció. Probá de nuevo." },
  failed: { ok: false, text: "No pudimos conectar con Mercado Pago" },
};


/**
 * Linking a business's own MercadoPago, with a button.
 *
 * It replaces a password field where the owner pasted an access token copied
 * from MercadoPago's developer panel — a step most people could not complete,
 * and one that broke on its own: the form submitted an empty token on every
 * save, which the API read as "disconnect".
 */
export function MercadoPagoConnection() {
  const { data, isLoading, mutate } = useSWR<Connection>("/api/panel/payments/mercadopago");
  const [connecting, setConnecting] = useState(false);
  const [confirmingUnlink, setConfirmingUnlink] = useState(false);
  const result = useSearchParams().get("mp");

  // Report the outcome once, and take it out of the URL so a refresh does not
  // repeat it.
  useEffect(() => {
    if (!result) return;

    const message = CALLBACK_MESSAGES[result];
    if (message) {
      if (message.ok) toast.success(message.text);
      else toast.error(message.text);
      mutate();
    }

    window.history.replaceState({}, "", window.location.pathname);
  }, [result, mutate]);

  async function connect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/panel/payments/mercadopago", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No pudimos iniciar la conexión");

      window.location.href = json.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos iniciar la conexión");
      setConnecting(false);
    }
  }

  async function unlink() {
    setConfirmingUnlink(false);
    try {
      const res = await fetch("/api/panel/payments/mercadopago", { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Mercado Pago desconectado");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos desconectar");
    }
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
      </div>
    );
  }

  const connected = data?.status === "ok";
  const needsAttention = data?.status === "broken" || data?.status === "expired";

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <ConfirmDialog
        open={confirmingUnlink}
        onOpenChange={setConfirmingUnlink}
        title="Desconectar Mercado Pago"
        description="Tus clientes van a dejar de poder pagar la seña al reservar. Los turnos que ya pagaron no se tocan."
        confirmLabel="Desconectar"
        cancelLabel="Volver"
        destructive
        onConfirm={unlink}
      />

      <div>
        <h3 className="font-heading font-semibold">Mercado Pago</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Conectá tu cuenta para cobrar la seña al momento de reservar. La plata
          entra directo a tu cuenta.
        </p>
      </div>

      {connected && (
        <>
          <div className="flex items-center gap-2 text-sm text-success-foreground">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Cuenta conectada
            {data?.account && (
              <span className="text-muted-foreground">
                · desde el{" "}
                {new Date(data.account.connectedAt).toLocaleDateString("es-AR")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setConfirmingUnlink(true)}
            className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors flex items-center gap-2"
          >
            <Unlink className="w-4 h-4" /> Desconectar
          </button>
        </>
      )}

      {needsAttention && (
        <div
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger-muted px-4 py-3 text-sm"
        >
          <p className="flex items-center gap-2 font-medium text-danger-foreground">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {data?.status === "expired"
              ? "La conexión venció"
              : "La conexión dejó de funcionar"}
          </p>
          <p className="text-danger-foreground/80 mt-1">
            Mientras tanto tus clientes reservan sin pagar la seña. Reconectala
            para volver a cobrar.
          </p>
        </div>
      )}

      {!connected && data?.available === false && (
        <p className="text-sm text-muted-foreground">
          La conexión con Mercado Pago no está disponible en este momento.
          Escribinos y lo resolvemos.
        </p>
      )}

      {!connected && data?.available !== false && (
        <>
          <button
            type="button"
            onClick={connect}
            disabled={connecting}
            className="h-10 px-4 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            {needsAttention ? "Reconectar Mercado Pago" : "Conectar Mercado Pago"}
          </button>
          <p className="text-xs text-muted-foreground">
            Te lleva a Mercado Pago para que autorices con tu cuenta. Todo lo que
            cobrás va directo a tu cuenta: Jiku no se queda con nada de cada seña,
            sólo con tu plan. Mercado Pago cobra la suya aparte, como siempre.
          </p>
        </>
      )}
    </div>
  );
}
