"use client";

import { useState } from "react";
import useSWR from "swr";
import { Code, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";


export function WidgetSettings() {
  const { data, isLoading, mutate } = useSWR("/api/panel/widget");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) return <TableSkeleton rows={4} />;

  const settings = data?.settings || { widgetEnabled: false, widgetTheme: "dark", widgetPosition: "bottom-right" };
  const embedCode = data?.embedCode || "";
  const previewUrl = data?.previewUrl || "";

  async function updateSetting(key: string, value: unknown) {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/widget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuración guardada");
      mutate();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Código copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-primary" />
          Widget Embebible
        </h3>

        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Widget Habilitado</p>
              <p className="text-sm text-muted-foreground">
                Permite que otros sitios web muestren tu botón de booking
              </p>
            </div>
            <button
              onClick={() => updateSetting("widgetEnabled", !settings.widgetEnabled)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.widgetEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.widgetEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Theme */}
          <div>
            <p className="font-medium mb-2">Tema</p>
            <div className="flex gap-2">
              {["dark", "light"].map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting("widgetTheme", theme)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize ${
                    settings.widgetTheme === theme
                      ? "brand-gradient text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {theme === "dark" ? "Oscuro" : "Claro"}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <p className="font-medium mb-2">Posición</p>
            <div className="flex gap-2">
              {[
                { value: "bottom-right", label: "Abajo Derecha" },
                { value: "bottom-left", label: "Abajo Izquierda" },
              ].map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => updateSetting("widgetPosition", pos.value)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    settings.widgetPosition === pos.value
                      ? "brand-gradient text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      {settings.widgetEnabled && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Código de Embebido</h3>
            <div className="flex items-center gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Preview <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <pre className="p-4 bg-background rounded-lg text-sm overflow-x-auto border border-border">
            <code className="text-muted-foreground">{embedCode}</code>
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Pega este código antes del cierre del tag {"</body>"} en tu sitio web.
          </p>
        </div>
      )}

      {saving && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          Guardando...
        </div>
      )}
    </div>
  );
}
