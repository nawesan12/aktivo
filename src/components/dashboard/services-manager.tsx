"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Clock,
  FolderPlus,
  Scissors,
} from "lucide-react";
import { toast } from "sonner";
import { serviceSchema } from "@/lib/validations";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { ImageUploader } from "@/components/upload/image-uploader";
import { formatCurrency } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  staff: { id: string; name: string }[];
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  _count: { services: number };
}

export function ServicesManager() {
  const { data: servicesData, isLoading: loadingServices, mutate: mutateServices } = useSWR("/api/panel/services");
  const { data: categoriesData, mutate: mutateCategories } = useSWR("/api/panel/categories");
  const { data: staffData } = useSWR("/api/panel/staff");
  // The uploader writes under the business's own folder, so it needs its id.
  const { data: settingsData } = useSWR<{ business?: { id: string } }>("/api/panel/settings");
  const businessId = settingsData?.business?.id ?? "";

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [serviceImage, setServiceImage] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", description: "", duration: 30, price: 0, categoryId: "", isActive: true },
  });

  const services: Service[] = servicesData?.data || [];
  const categories: Category[] = categoriesData?.data || [];
  const allStaff = staffData?.data || [];

  function openCreate() {
    setEditingService(null);
    setSelectedStaff([]);
    setServiceImage("");
    reset({ name: "", description: "", duration: 30, price: 0, categoryId: "", isActive: true });
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setSelectedStaff(service.staff.map((s) => s.id));
    setServiceImage("");
    reset({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
      categoryId: service.categoryId || "",
      isActive: service.isActive,
    });
    setShowForm(true);
  }

  async function onSubmit(data: Record<string, unknown>) {
    try {
      const payload = { ...data, staffIds: selectedStaff, image: serviceImage || undefined };
      const url = editingService
        ? `/api/panel/services/${editingService.id}`
        : "/api/panel/services";
      const method = editingService ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(editingService ? "Servicio actualizado" : "Servicio creado");
      mutateServices();
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/panel/services/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Servicio eliminado");
      mutateServices();
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/panel/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Categoría creada");
      mutateCategories();
      setNewCategoryName("");
      setShowCategoryForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      const res = await fetch(`/api/panel/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Categoría eliminada");
      mutateCategories();
      mutateServices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  if (loadingServices) return <TableSkeleton rows={5} />;

  // Group services by category
  const uncategorized = services.filter((s) => !s.categoryId);
  const grouped = categories.map((cat) => ({
    ...cat,
    services: services.filter((s) => s.categoryId === cat.id),
  }));

  return (
    <>
      {/* Actions bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={openCreate}
          className="h-9 px-4 rounded-lg brand-gradient text-white text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
        <button
          onClick={() => setShowCategoryForm(true)}
          className="h-9 px-4 rounded-lg border border-border bg-muted/30 text-sm font-medium hover:bg-muted/50 transition-colors flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" /> Nueva categoría
        </button>
      </div>

      {/* Category form */}
      {showCategoryForm && (
        <div className="glass rounded-xl p-4 flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="nombre-de-la-categoria" className="text-sm font-medium mb-1.5 block">Nombre de la categoría</label>
            <input
              id="nombre-de-la-categoria"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej: Cortes"
              className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleCreateCategory}
            className="h-9 px-4 rounded-lg brand-gradient text-white text-sm font-medium"
          >
            Crear
          </button>
          <button
            onClick={() => setShowCategoryForm(false)}
            aria-label="Cancelar la nueva categoría"
            className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Services by category */}
      {grouped.map((cat) => (
        <div key={cat.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm">{cat.name}</h3>
            <button
              onClick={() => handleDeleteCategory(cat.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Eliminar categoría
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {cat.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => openEdit(service)}
                onDelete={() => setDeleteId(service.id)}
              />
            ))}
            {cat.services.length === 0 && (
              <p className="text-sm text-muted-foreground p-4 glass rounded-lg">Sin servicios en esta categoría</p>
            )}
          </div>
        </div>
      ))}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-sm text-muted-foreground">Sin categoría</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {uncategorized.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => openEdit(service)}
                onDelete={() => setDeleteId(service.id)}
              />
            ))}
          </div>
        </div>
      )}

      {services.length === 0 && !loadingServices && (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center">
          <Scissors className="w-10 h-10 mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No hay servicios creados</p>
          <button
            onClick={openCreate}
            className="mt-3 h-9 px-4 rounded-lg brand-gradient text-white text-sm font-medium"
          >
            Crear primer servicio
          </button>
        </div>
      )}

      {/* Dialog from shadcn: focus trap, Escape, and an announced role —
          none of which the hand-rolled overlay had. */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Imagen</label>
                <ImageUploader
                  value={serviceImage || null}
                  onChange={(url) => setServiceImage(url ?? "")}
                  ownerId={businessId}
                  kind="service"
                  aspectRatio="16:9"
                />
              </div>
              <div>
                <label htmlFor="name" className="text-sm font-medium mb-1.5 block">Nombre</label>
                <input id="name" {...register("name")} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="description" className="text-sm font-medium mb-1.5 block">Descripción</label>
                <textarea id="description" {...register("description")} rows={2} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration" className="text-sm font-medium mb-1.5 block">Duración (min)</label>
                  <input id="duration" {...register("duration", { valueAsNumber: true })} type="number" min={5} max={480} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary" />
                  {errors.duration && <p className="text-xs text-destructive mt-1">{errors.duration.message}</p>}
                </div>
                <div>
                  <label htmlFor="price" className="text-sm font-medium mb-1.5 block">Precio ($)</label>
                  <input id="price" {...register("price", { valueAsNumber: true })} type="number" min={0} step={100} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary" />
                  {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="categoryId" className="text-sm font-medium mb-1.5 block">Categoría</label>
                <select id="categoryId" {...register("categoryId")} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Profesionales asignados</label>
                <div className="flex flex-wrap gap-2">
                  {allStaff.map((s: { id: string; name: string }) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStaff((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedStaff.includes(s.id)
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/30 border-border hover:bg-muted/50"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                  {allStaff.length === 0 && <p className="text-xs text-muted-foreground">No hay profesionales</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  id="isActive"
                  className="rounded border-border"
                />
                <label htmlFor="isActive" className="text-sm">Activo</label>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingService ? "Guardar cambios" : "Crear servicio"}
              </button>
            </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar servicio"
        description="Esta acción no se puede deshacer: el servicio se elimina de forma permanente."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </>
  );
}

function ServiceCard({ service, onEdit, onDelete }: { service: Service; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className={`glass rounded-xl p-4 ${!service.isActive ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-sm">{service.name}</h4>
          {service.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            aria-label={`Editar ${service.name}`}
            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Eliminar ${service.name}`}
            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.duration} min</span>
        <span className="flex items-center gap-1">{formatCurrency(service.price)}</span>
      </div>
      {service.staff.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {service.staff.map((s) => (
            <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50">{s.name}</span>
          ))}
        </div>
      )}
      {!service.isActive && (
        <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-warning-muted text-warning-foreground">Inactivo</span>
      )}
    </div>
  );
}
