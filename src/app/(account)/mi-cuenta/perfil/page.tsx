"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { ImageUploader } from "@/components/upload/image-uploader";


export default function ProfilePage() {
  const { data, isLoading, mutate } = useSWR("/api/account/profile");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setName(data.name || "");
      setPhone(data.phone || "");
      setImage(data.image || null);
    }
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, image }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Perfil actualizado");
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
      <div>
        <h1 className="text-2xl font-heading font-bold">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Administra tu información personal</p>
      </div>

      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16">
            <ImageUploader
              value={image}
              onChange={(url) => setImage(url)}
              folder="aktivo/profiles"
              aspectRatio="1:1"
              className="w-16 h-16 rounded-full"
            />
          </div>
          <div>
            <p className="font-medium">{data?.name}</p>
            <p className="text-sm text-muted-foreground">{data?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              value={data?.email || ""}
              disabled
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none opacity-60"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Teléfono</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 11 1234-5678"
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
