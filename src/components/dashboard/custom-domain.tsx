"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Globe, Loader2, Check, AlertCircle, Copy, Trash2 } from "lucide-react";
import { errorMessage, messageOf } from "@/lib/api-message";

interface DomainResponse {
  configured: boolean;
  domain: string | null;
  status: "NONE" | "PENDING" | "ACTIVE" | "ERROR";
  aRecord?: string;
  cname?: string;
  verification?: { type: string; domain: string; value: string }[];
}

/** An apex domain needs an A record; a subdomain needs a CNAME. */
function isApex(domain: string): boolean {
  return domain.split(".").length === 2;
}

export function CustomDomain() {
  const { data, isLoading, mutate } = useSWR<DomainResponse>("/api/panel/dominio");
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);

  async function connect() {
    setWorking(true);
    try {
      const res = await fetch("/api/panel/dominio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: input }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success("Dominio agregado. Falta apuntarlo desde tu proveedor.");
      setInput("");
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos conectar el dominio"));
    } finally {
      setWorking(false);
    }
  }

  async function disconnect() {
    setWorking(true);
    try {
      const res = await fetch("/api/panel/dominio", { method: "DELETE" });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success("Dominio desconectado");
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos desconectar el dominio"));
    } finally {
      setWorking(false);
    }
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copiado");
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-10 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Said plainly rather than showing a form that cannot work: the server needs
  // credentials for the hosting provider, and without them nothing here does
  // anything.
  if (data && !data.configured) {
    return (
      <div className="glass rounded-xl p-6">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4" /> Dominio propio
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Todavía no está habilitado en este servidor. Escribinos y lo activamos.
        </p>
      </div>
    );
  }

  const domain = data?.domain;
  const active = data?.status === "ACTIVE";

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div>
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4" /> Dominio propio
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Que tus clientes reserven en mibarberia.com en vez de en un link nuestro.
        </p>
      </div>

      {!domain ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="mibarberia.com"
            aria-label="Tu dominio"
            className="flex-1 h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={connect}
            disabled={working || input.trim().length < 4}
            className="h-10 px-5 rounded-lg brand-gradient text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {working && <Loader2 className="w-4 h-4 animate-spin" />}
            Conectar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-medium">{domain}</span>
              {active ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success-muted text-success-foreground">
                  <Check className="w-3 h-3" /> Funcionando
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning-muted text-warning-foreground">
                  <AlertCircle className="w-3 h-3" /> Falta el DNS
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => mutate()}
                className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted"
              >
                Volver a chequear
              </button>
              <button
                onClick={disconnect}
                disabled={working}
                aria-label="Desconectar el dominio"
                className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Desconectar
              </button>
            </div>
          </div>

          {!active && (
            <div className="rounded-lg bg-muted/30 p-4 space-y-3">
              <p className="text-sm">
                Entrá donde compraste el dominio y cargá este registro. Puede
                tardar hasta unas horas en propagarse.
              </p>
              <DnsRecord
                label="Tipo"
                value={isApex(domain) ? "A" : "CNAME"}
                onCopy={copy}
              />
              <DnsRecord label="Nombre" value={isApex(domain) ? "@" : domain.split(".")[0]} onCopy={copy} />
              <DnsRecord
                label="Valor"
                value={isApex(domain) ? data?.aRecord ?? "" : data?.cname ?? ""}
                onCopy={copy}
              />

              {data?.verification?.map((record) => (
                <DnsRecord
                  key={record.value}
                  label={`Verificación (${record.type})`}
                  value={record.value}
                  onCopy={copy}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DnsRecord({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-xs font-mono truncate">{value}</code>
        <button
          onClick={() => onCopy(value)}
          aria-label={`Copiar ${label}`}
          className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
