"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, X, Tag, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";


interface ClientTag {
  id: string;
  name: string;
  color: string;
  _count: { assignments: number };
}

const PRESET_COLORS = [
  "#6366F1", "#22D3EE", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
];

export function ClientTagsManager() {
  const { data, mutate } = useSWR<{ data: ClientTag[] }>("/api/panel/tags");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const tags = data?.data || [];

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    try {
      const url = editingId ? `/api/panel/tags/${editingId}` : "/api/panel/tags";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(editingId ? "Tag actualizado" : "Tag creado");
      setShowForm(false);
      setEditingId(null);
      setName("");
      setColor(PRESET_COLORS[0]);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/panel/tags/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Tag eliminado");
      mutate();
    } catch {
      toast.error("Error al eliminar tag");
    }
  }

  function startEdit(tag: ClientTag) {
    setEditingId(tag.id);
    setName(tag.name);
    setColor(tag.color);
    setShowForm(true);
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Tags de Clientes</h3>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setName(""); setColor(PRESET_COLORS[0]); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg brand-gradient text-white"
        >
          <Plus className="w-4 h-4" /> Nuevo Tag
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del tag"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-transform"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "#fff" : "transparent",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-sm rounded-lg brand-gradient text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Actualizar" : "Crear"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border border-border/50 hover:border-border transition-colors"
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
            <span>{tag.name}</span>
            <span className="text-xs text-muted-foreground">({tag._count.assignments})</span>
            <div className="hidden group-hover:flex items-center gap-1 ml-1">
              <button onClick={() => startEdit(tag)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => handleDelete(tag.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">No hay tags creados</p>
        )}
      </div>
    </div>
  );
}

// Inline tag badge for client lists
export function TagBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

// Tag assignment widget for client detail panel
export function ClientTagAssigner({ clientId }: { clientId: string }) {
  const { data: allTags } = useSWR<{ data: ClientTag[] }>("/api/panel/tags");
  const { data: clientTags, mutate: mutateClientTags } = useSWR<{ data: { id: string; name: string; color: string }[] }>(
    `/api/panel/clients/${clientId}/tags`
  );
  const [assigning, setAssigning] = useState(false);

  const assigned = clientTags?.data || [];
  const available = (allTags?.data || []).filter(
    (t) => !assigned.some((a) => a.id === t.id)
  );

  async function assignTag(tagId: string) {
    setAssigning(true);
    try {
      const res = await fetch(`/api/panel/clients/${clientId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      if (!res.ok) throw new Error();
      mutateClientTags();
    } catch {
      toast.error("Error al asignar tag");
    } finally {
      setAssigning(false);
    }
  }

  async function removeTag(tagId: string) {
    try {
      const res = await fetch(`/api/panel/clients/${clientId}/tags?tagId=${tagId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      mutateClientTags();
    } catch {
      toast.error("Error al remover tag");
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</p>
      <div className="flex flex-wrap gap-1.5">
        {assigned.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs group cursor-pointer"
            style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
            onClick={() => removeTag(tag.id)}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
            <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        ))}
        {available.length > 0 && (
          <div className="relative group">
            <button
              disabled={assigning}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
            <div className="absolute z-10 top-full left-0 mt-1 hidden group-hover:block bg-popover border border-border rounded-lg p-1 shadow-lg min-w-[120px]">
              {available.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => assignTag(tag.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-accent text-left"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
