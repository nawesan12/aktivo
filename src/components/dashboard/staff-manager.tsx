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
  User,
  Mail,
  Phone,
  Scissors,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { staffSchema, type StaffInput } from "@/lib/validations";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { ImageUploader } from "@/components/upload/image-uploader";


interface StaffMember {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  specialty?: string | null;
  image?: string | null;
  isActive: boolean;
  services: { id: string; name: string }[];
  _count: { appointments: number };
}

export function StaffManager() {
  const { data, isLoading, mutate } = useSWR("/api/panel/staff");
  const { data: servicesData } = useSWR("/api/panel/services");

  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [staffImage, setStaffImage] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
  });

  const staff: StaffMember[] = data?.data || [];
  const allServices = servicesData?.data || [];

  function openCreate() {
    setEditingStaff(null);
    setSelectedServices([]);
    setStaffImage("");
    reset({ name: "", email: "", phone: "", bio: "", specialty: "" });
    setShowForm(true);
  }

  function openEdit(member: StaffMember) {
    setEditingStaff(member);
    setSelectedServices(member.services.map((s) => s.id));
    setStaffImage(member.image || "");
    reset({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      bio: member.bio || "",
      specialty: member.specialty || "",
    });
    setShowForm(true);
  }

  async function onSubmit(data: StaffInput) {
    try {
      const payload = { ...data, serviceIds: selectedServices, image: staffImage || undefined };
      const url = editingStaff ? `/api/panel/staff/${editingStaff.id}` : "/api/panel/staff";
      const method = editingStaff ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(editingStaff ? "Profesional actualizado" : "Profesional creado");
      mutate();
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/panel/staff/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Profesional eliminado");
      mutate();
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  async function toggleActive(member: StaffMember) {
    try {
      const res = await fetch(`/api/panel/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      toast.success(member.isActive ? "Profesional desactivado" : "Profesional activado");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  if (isLoading) return <TableSkeleton rows={4} />;

  return (
    <>
      <div className="flex">
        <button onClick={openCreate} className="h-9 px-4 rounded-lg brand-gradient text-white text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo profesional
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center">
          <UserPlus className="w-10 h-10 mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No hay profesionales</p>
          <button onClick={openCreate} className="mt-3 h-9 px-4 rounded-lg brand-gradient text-white text-sm font-medium">
            Agregar profesional
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div key={member.id} className={`glass rounded-xl p-5 ${!member.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate">{member.name}</h3>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(member)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(member.id)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {member.specialty && (
                    <p className="text-xs text-muted-foreground mt-0.5">{member.specialty}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {member.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" /> {member.email}
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" /> {member.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Scissors className="w-3 h-3" /> {member.services.length} servicio{member.services.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => toggleActive(member)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    member.isActive
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}
                >
                  {member.isActive ? "Activo" : "Inactivo"}
                </button>
                <span className="text-xs text-muted-foreground">
                  {member._count.appointments} turno{member._count.appointments !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-heading font-semibold">{editingStaff ? "Editar profesional" : "Nuevo profesional"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Foto</label>
                <ImageUploader
                  value={staffImage || null}
                  onChange={setStaffImage}
                  folder="aktivo/staff"
                  aspectRatio="1:1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nombre</label>
                <input {...register("name")} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <input {...register("email")} type="email" className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Telefono</label>
                  <input {...register("phone")} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Especialidad</label>
                <input {...register("specialty")} className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Bio</label>
                <textarea {...register("bio")} rows={2} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Servicios asignados</label>
                <div className="flex flex-wrap gap-2">
                  {allServices.map((s: { id: string; name: string }) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServices((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedServices.includes(s.id)
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/30 border-border hover:bg-muted/50"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                  {allServices.length === 0 && <p className="text-xs text-muted-foreground">No hay servicios</p>}
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingStaff ? "Guardar cambios" : "Crear profesional"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="glass rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading font-semibold">Eliminar profesional</h2>
            <p className="text-sm text-muted-foreground">
              Esta accion no se puede deshacer. No se podra eliminar si tiene turnos pendientes.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
