"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus, Megaphone, Play, Pause, Trash2, Loader2,
  Mail, MessageSquare, Users, BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Campaign {
  id: string;
  name: string;
  type: "BIRTHDAY" | "REBOOKING" | "INACTIVITY" | "CUSTOM";
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  messageSubject: string | null;
  messageBody: string;
  triggerConfig: Record<string, unknown> | null;
  targetTagIds: string[];
  channel: "EMAIL" | "WHATSAPP";
  createdAt: string;
  updatedAt: string;
  _count: { executions: number };
}

const typeLabels: Record<string, string> = {
  BIRTHDAY: "Cumpleaños",
  REBOOKING: "Re-booking",
  INACTIVITY: "Inactividad",
  CUSTOM: "Personalizada",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Borrador", color: "text-zinc-400 bg-zinc-500/10" },
  ACTIVE: { label: "Activa", color: "text-emerald-400 bg-emerald-500/10" },
  PAUSED: { label: "Pausada", color: "text-yellow-400 bg-yellow-500/10" },
  COMPLETED: { label: "Completada", color: "text-blue-400 bg-blue-500/10" },
};

export function CampaignsManager() {
  const { data, isLoading, mutate } = useSWR("/api/panel/campaigns", fetcher);
  const { data: tagsData } = useSWR("/api/panel/tags", fetcher);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("CUSTOM");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [channel, setChannel] = useState<string>("EMAIL");
  const [targetTagIds, setTargetTagIds] = useState<string[]>([]);
  const [triggerDays, setTriggerDays] = useState("30");

  const campaigns: Campaign[] = data?.data || [];
  const tags = tagsData?.data || [];

  async function handleCreate() {
    if (!name.trim() || !messageBody.trim()) return;
    setSaving(true);

    try {
      const triggerConfig = type === "INACTIVITY"
        ? { inactivityDays: parseInt(triggerDays) }
        : type === "REBOOKING"
          ? { rebookingDays: parseInt(triggerDays) }
          : null;

      const res = await fetch("/api/panel/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          messageSubject: messageSubject.trim() || null,
          messageBody: messageBody.trim(),
          channel,
          targetTagIds,
          triggerConfig,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      toast.success("Campaña creada");
      resetForm();
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setName("");
    setType("CUSTOM");
    setMessageSubject("");
    setMessageBody("");
    setChannel("EMAIL");
    setTargetTagIds([]);
    setTriggerDays("30");
  }

  async function toggleStatus(campaign: Campaign) {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED"
      : campaign.status === "PAUSED" || campaign.status === "DRAFT" ? "ACTIVE"
      : null;

    if (!newStatus) return;

    try {
      const res = await fetch(`/api/panel/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Campaña ${newStatus === "ACTIVE" ? "activada" : "pausada"}`);
      mutate();
    } catch {
      toast.error("Error al actualizar");
    }
  }

  async function executeCampaign(id: string) {
    setExecuting(id);
    try {
      const res = await fetch(`/api/panel/campaigns/${id}/execute`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(`Enviados: ${result.sent}, Errores: ${result.errors}`);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al ejecutar");
    } finally {
      setExecuting(null);
    }
  }

  async function deleteCampaign(id: string) {
    try {
      const res = await fetch(`/api/panel/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Campaña eliminada");
      mutate();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  if (isLoading) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Campañas</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg brand-gradient text-white"
        >
          <Plus className="w-4 h-4" /> Nueva Campaña
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass rounded-xl p-6 space-y-4">
          <h3 className="font-medium">Nueva Campaña</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                placeholder="Ej: Reactivación clientes inactivos"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="CUSTOM">Personalizada</option>
                <option value="BIRTHDAY">Cumpleaños</option>
                <option value="REBOOKING">Re-booking</option>
                <option value="INACTIVITY">Inactividad</option>
              </select>
            </div>
          </div>

          {(type === "INACTIVITY" || type === "REBOOKING") && (
            <div>
              <label className="text-sm text-muted-foreground">
                {type === "INACTIVITY" ? "Días de inactividad" : "Días desde último turno"}
              </label>
              <input
                type="number"
                value={triggerDays}
                onChange={(e) => setTriggerDays(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                min="1"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-muted-foreground">Asunto del email</label>
            <input
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              placeholder="Ej: ¡Te extrañamos, {{clientName}}!"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">
              Mensaje <span className="text-xs">(Variables: {"{{clientName}}"}, {"{{businessName}}"})</span>
            </label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={4}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
              placeholder="Hola {{clientName}}, te esperamos en {{businessName}}..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Canal</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Filtrar por tags (opcional)</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((tag: { id: string; name: string; color: string }) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setTargetTagIds((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
                    style={{
                      backgroundColor: targetTagIds.includes(tag.id) ? `${tag.color}20` : "transparent",
                      borderColor: targetTagIds.includes(tag.id) ? tag.color : "var(--border)",
                      color: targetTagIds.includes(tag.id) ? tag.color : "var(--muted-foreground)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !name.trim() || !messageBody.trim()}
              className="px-4 py-2 text-sm rounded-lg brand-gradient text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Campaña"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{campaign.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig[campaign.status].color}`}>
                    {statusConfig[campaign.status].label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    {typeLabels[campaign.type]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{campaign.messageBody}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {campaign.channel === "EMAIL" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    {campaign.channel}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {campaign._count.executions} enviados
                  </span>
                  <span>
                    {format(new Date(campaign.updatedAt), "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {campaign.status !== "COMPLETED" && (
                  <button
                    onClick={() => toggleStatus(campaign)}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title={campaign.status === "ACTIVE" ? "Pausar" : "Activar"}
                  >
                    {campaign.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => executeCampaign(campaign.id)}
                  disabled={executing === campaign.id}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                  title="Ejecutar ahora"
                >
                  {executing === campaign.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BarChart2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteCampaign(campaign.id)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && !showForm && (
          <div className="text-center py-12 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No hay campañas creadas</p>
          </div>
        )}
      </div>
    </div>
  );
}
