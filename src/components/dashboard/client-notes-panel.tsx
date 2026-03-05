"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
}

export function ClientNotesPanel({ clientId }: { clientId: string }) {
  const { data, mutate } = useSWR<{ data: Note[] }>(
    `/api/panel/clients/${clientId}/notes`,
    fetcher
  );
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const notes = data?.data || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);

    try {
      const res = await fetch(`/api/panel/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setContent("");
      mutate();
      toast.success("Nota agregada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al agregar nota");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notas</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Agregar nota..."
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {notes.map((note) => (
          <div key={note.id} className="p-2 bg-muted/30 rounded-lg">
            <p className="text-sm">{note.content}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {note.author.name} · {format(new Date(note.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
            </p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">Sin notas</p>
        )}
      </div>
    </div>
  );
}
