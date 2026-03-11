"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Loader2, Save, Building2, Settings } from "lucide-react";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { ImageUploader } from "@/components/upload/image-uploader";
import { getUploadFolder } from "@/lib/cloudinary";


export function BusinessSettings() {
  const { data, isLoading, mutate } = useSWR("/api/panel/settings");
  const [saving, setSaving] = useState(false);

  const [business, setBusiness] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    province: "",
    website: "",
    primaryColor: "",
    accentColor: "",
    logo: "",
    coverImage: "",
  });

  const [settings, setSettings] = useState({
    slotInterval: 30,
    minAdvanceHours: 2,
    maxAdvanceDays: 30,
    bufferMinutes: 0,
    allowGuestBooking: true,
  });

  useEffect(() => {
    if (data) {
      setBusiness({
        name: data.business.name || "",
        slug: data.business.slug || "",
        description: data.business.description || "",
        phone: data.business.phone || "",
        whatsapp: data.business.whatsapp || "",
        email: data.business.email || "",
        address: data.business.address || "",
        city: data.business.city || "",
        province: data.business.province || "",
        website: data.business.website || "",
        primaryColor: data.business.primaryColor || "",
        accentColor: data.business.accentColor || "",
        logo: data.business.logo || "",
        coverImage: data.business.coverImage || "",
      });
      if (data.settings) {
        setSettings({
          slotInterval: data.settings.slotInterval || 30,
          minAdvanceHours: data.settings.minAdvanceHours || 2,
          maxAdvanceDays: data.settings.maxAdvanceDays || 30,
          bufferMinutes: data.settings.bufferMinutes || 0,
          allowGuestBooking: data.settings.allowGuestBooking ?? true,
        });
      }
    }
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business, settings }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Configuración guardada");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      {/* Business profile */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Perfil del negocio
        </h3>

        <div className="flex flex-wrap gap-6 mb-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Logo</label>
            <ImageUploader
              value={business.logo || null}
              onChange={(url) => setBusiness((p) => ({ ...p, logo: url }))}
              folder={getUploadFolder(business.slug || "default", "business")}
              aspectRatio="1:1"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1.5 block">Imagen de portada</label>
            <ImageUploader
              value={business.coverImage || null}
              onChange={(url) => setBusiness((p) => ({ ...p, coverImage: url }))}
              folder={getUploadFolder(business.slug || "default", "business")}
              aspectRatio="16:9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nombre del negocio</label>
            <input
              value={business.name}
              onChange={(e) => setBusiness((p) => ({ ...p, name: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Slug (URL)</label>
            <input
              value={business.slug}
              disabled
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none opacity-60"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1.5 block">Descripción</label>
            <textarea
              value={business.description}
              onChange={(e) => setBusiness((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Teléfono</label>
            <input
              value={business.phone}
              onChange={(e) => setBusiness((p) => ({ ...p, phone: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">WhatsApp</label>
            <input
              value={business.whatsapp}
              onChange={(e) => setBusiness((p) => ({ ...p, whatsapp: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              value={business.email}
              onChange={(e) => setBusiness((p) => ({ ...p, email: e.target.value }))}
              type="email"
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Website</label>
            <input
              value={business.website}
              onChange={(e) => setBusiness((p) => ({ ...p, website: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Dirección</label>
            <input
              value={business.address}
              onChange={(e) => setBusiness((p) => ({ ...p, address: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ciudad</label>
            <input
              value={business.city}
              onChange={(e) => setBusiness((p) => ({ ...p, city: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Provincia</label>
            <input
              value={business.province}
              onChange={(e) => setBusiness((p) => ({ ...p, province: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Color primario</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={business.primaryColor || "#6366f1"}
                onChange={(e) => setBusiness((p) => ({ ...p, primaryColor: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <input
                value={business.primaryColor}
                onChange={(e) => setBusiness((p) => ({ ...p, primaryColor: e.target.value }))}
                placeholder="#6366f1"
                className="flex-1 h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Color acentuado</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={business.accentColor || "#8b5cf6"}
                onChange={(e) => setBusiness((p) => ({ ...p, accentColor: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <input
                value={business.accentColor}
                onChange={(e) => setBusiness((p) => ({ ...p, accentColor: e.target.value }))}
                placeholder="#8b5cf6"
                className="flex-1 h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking settings */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" /> Configuración de turnos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Intervalo de slots (min)</label>
            <select
              value={settings.slotInterval}
              onChange={(e) => setSettings((p) => ({ ...p, slotInterval: parseInt(e.target.value) }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Anticipación mínima (hs)</label>
            <input
              type="number"
              min={0}
              max={72}
              value={settings.minAdvanceHours}
              onChange={(e) => setSettings((p) => ({ ...p, minAdvanceHours: parseInt(e.target.value) || 0 }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Días de anticipación max</label>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.maxAdvanceDays}
              onChange={(e) => setSettings((p) => ({ ...p, maxAdvanceDays: parseInt(e.target.value) || 30 }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Buffer entre turnos (min)</label>
            <input
              type="number"
              min={0}
              max={60}
              value={settings.bufferMinutes}
              onChange={(e) => setSettings((p) => ({ ...p, bufferMinutes: parseInt(e.target.value) || 0 }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowGuestBooking}
                onChange={(e) => setSettings((p) => ({ ...p, allowGuestBooking: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">Permitir reservas de invitados</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
