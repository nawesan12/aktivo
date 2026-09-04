"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, Eye, EyeOff, Trash2, Loader2, MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { errorMessage, messageOf } from "@/lib/api-message";


interface Review {
  id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  respondedAt: string | null;
  isVisible: boolean;
  createdAt: string;
  appointment: {
    service: { name: string };
    staff: { name: string };
  };
  user: { id: string; name: string | null; image: string | null } | null;
  guestClient: { id: string; name: string } | null;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${i <= rating ? "text-warning-foreground fill-yellow-500" : "text-neutral-foreground"}`}
        />
      ))}
    </div>
  );
}

export function ReviewsDashboard() {
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [visibleFilter, setVisibleFilter] = useState<string>("");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [respondingLoading, setRespondingLoading] = useState(false);

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (ratingFilter) params.set("rating", ratingFilter);
  if (visibleFilter) params.set("visible", visibleFilter);

  const { data, isLoading, mutate } = useSWR(
    `/api/panel/reviews?${params}`, { refreshInterval: 300000, revalidateOnFocus: true }
  );

  async function toggleVisibility(id: string, isVisible: boolean) {
    try {
      const res = await fetch(`/api/panel/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !isVisible }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success(isVisible ? "Reseña ocultada" : "Reseña visible");
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "Error al actualizar reseña"));
    }
  }

  async function submitResponse(id: string) {
    setRespondingLoading(true);
    try {
      const res = await fetch(`/api/panel/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success("Respuesta guardada");
      setRespondingTo(null);
      setResponseText("");
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "Error al guardar respuesta"));
    } finally {
      setRespondingLoading(false);
    }
  }

  async function deleteReview(id: string) {
    try {
      const res = await fetch(`/api/panel/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success("Reseña eliminada");
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "Error al eliminar reseña"));
    }
  }

  if (isLoading) return <TableSkeleton rows={8} />;

  const reviews: Review[] = data?.data || [];
  const stats = data?.stats || { averageRating: 0, totalReviews: 0 };
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
          <StarRating rating={Math.round(stats.averageRating)} size="lg" />
          <p className="text-sm text-muted-foreground mt-1">Promedio</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-3xl font-bold">{stats.totalReviews}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Reseñas</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-3xl font-bold">
            {stats.totalReviews > 0
              ? Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100)
              : 0}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">Satisfacción (4-5⭐)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
        >
          <option value="">Todas las estrellas</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} estrella{r > 1 ? "s" : ""}</option>
          ))}
        </select>
        <select
          value={visibleFilter}
          onChange={(e) => { setVisibleFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
        >
          <option value="">Todas</option>
          <option value="true">Visibles</option>
          <option value="false">Ocultas</option>
        </select>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="glass rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              {/* min-w-0: a flex child's default minimum is its content, so the
                  meta row below refused to shrink and pushed the card 8px past
                  a 375px screen. */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-medium">
                    {review.user?.name || review.guestClient?.name || "Anónimo"}
                  </span>
                  {!review.isVisible && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-muted text-neutral-foreground">Oculta</span>
                  )}
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{review.appointment.service.name}</span>
                  <span>·</span>
                  <span>{review.appointment.staff.name}</span>
                  <span>·</span>
                  <span>{format(new Date(review.createdAt), "dd MMM yyyy", { locale: es })}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setRespondingTo(respondingTo === review.id ? null : review.id);
                    setResponseText(review.response || "");
                  }}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="Responder"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleVisibility(review.id, review.isVisible)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title={review.isVisible ? "Ocultar" : "Mostrar"}
                >
                  {review.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Existing response */}
            {review.response && respondingTo !== review.id && (
              <div className="mt-3 bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Respuesta del negocio</p>
                <p className="text-sm">{review.response}</p>
              </div>
            )}

            {/* Response form */}
            {respondingTo === review.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setRespondingTo(null); setResponseText(""); }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted"
                  >
                    <X className="w-3 h-3 inline mr-1" />
                    Cancelar
                  </button>
                  <button
                    onClick={() => submitResponse(review.id)}
                    disabled={!responseText.trim() || respondingLoading}
                    className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {respondingLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Responder
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No hay reseñas aún</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
