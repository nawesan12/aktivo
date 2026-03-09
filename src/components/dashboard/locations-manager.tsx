"use client";

import { useState } from "react";
import useSWR from "swr";
import { MapPin, Plus, Building2, Users, Scissors, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";


interface Location {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  _count: { staff: number; services: number; appointments: number };
}

export function LocationsManager() {
  const { data: groupData, isLoading: groupLoading, mutate: mutateGroup } = useSWR("/api/panel/group");
  const { data: locationsData, isLoading: locsLoading, mutate: mutateLocations } = useSWR("/api/panel/group/locations");
  const { data: reportsData } = useSWR("/api/panel/group/reports?range=30d");

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  // Group form
  const [groupName, setGroupName] = useState("");

  // Location form
  const [locName, setLocName] = useState("");
  const [locSlug, setLocSlug] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locPhone, setLocPhone] = useState("");

  if (groupLoading || locsLoading) return <TableSkeleton rows={6} />;

  const group = groupData?.group;
  const locations: Location[] = locationsData?.data || [];
  const reports = reportsData;

  async function createGroup() {
    if (!groupName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/panel/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Grupo creado");
      setShowCreateGroup(false);
      setGroupName("");
      mutateGroup();
      mutateLocations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear grupo");
    } finally {
      setSaving(false);
    }
  }

  async function addLocation() {
    if (!locName.trim() || !locSlug.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/panel/group/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locName.trim(),
          slug: locSlug.trim(),
          address: locAddress.trim() || null,
          city: locCity.trim() || null,
          phone: locPhone.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Sucursal agregada");
      setShowAddLocation(false);
      setLocName(""); setLocSlug(""); setLocAddress(""); setLocCity(""); setLocPhone("");
      mutateLocations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al agregar");
    } finally {
      setSaving(false);
    }
  }

  // No group yet
  if (!group) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl p-8 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-bold mb-2">Multi-Sucursal</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crea un grupo para gestionar múltiples sucursales desde un solo panel.
            Cada sucursal mantiene su propia configuración, equipo y servicios.
          </p>
          {!showCreateGroup ? (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="px-6 py-3 rounded-xl brand-gradient text-white font-semibold"
            >
              Crear Grupo
            </button>
          ) : (
            <div className="max-w-sm mx-auto space-y-3">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nombre del grupo (ej: Mi Cadena)"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm"
                autoFocus
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={createGroup}
                  disabled={saving || !groupName.trim()}
                  className="px-4 py-2 text-sm rounded-lg brand-gradient text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
                </button>
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 text-sm rounded-lg bg-muted"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Reports Summary */}
      {reports && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{reports.totals?.appointments || 0}</p>
            <p className="text-sm text-muted-foreground">Turnos (30d)</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">
              ${(reports.totals?.revenue || 0).toLocaleString("es-AR")}
            </p>
            <p className="text-sm text-muted-foreground">Ingresos (30d)</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{reports.locationCount || 0}</p>
            <p className="text-sm text-muted-foreground">Sucursales</p>
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Sucursales
        </h2>
        <button
          onClick={() => setShowAddLocation(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg brand-gradient text-white"
        >
          <Plus className="w-4 h-4" /> Agregar Sucursal
        </button>
      </div>

      {/* Add Location Form */}
      {showAddLocation && (
        <div className="glass rounded-xl p-6 space-y-4">
          <h3 className="font-medium">Nueva Sucursal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Nombre</label>
              <input
                value={locName}
                onChange={(e) => { setLocName(e.target.value); if (!locSlug) setLocSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Slug (URL)</label>
              <input
                value={locSlug}
                onChange={(e) => setLocSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Dirección</label>
              <input
                value={locAddress}
                onChange={(e) => setLocAddress(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Ciudad</label>
              <input
                value={locCity}
                onChange={(e) => setLocCity(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addLocation}
              disabled={saving || !locName.trim() || !locSlug.trim()}
              className="px-4 py-2 text-sm rounded-lg brand-gradient text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agregar"}
            </button>
            <button onClick={() => setShowAddLocation(false)} className="px-4 py-2 text-sm rounded-lg bg-muted">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => {
          const locReport = reports?.locations?.find((l: { id: string }) => l.id === loc.id);
          return (
            <div key={loc.id} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium">{loc.name}</h3>
                  <p className="text-sm text-muted-foreground">/{loc.slug}</p>
                  {loc.address && <p className="text-xs text-muted-foreground mt-1">{loc.address}{loc.city ? `, ${loc.city}` : ""}</p>}
                </div>
                <MapPin className="w-5 h-5 text-primary shrink-0" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{loc._count.staff} staff</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>{loc._count.services} serv.</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{locReport?.appointments || 0} turnos</span>
                </div>
              </div>
              {locReport && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium">
                    ${(locReport.revenue || 0).toLocaleString("es-AR")}
                    <span className="text-xs text-muted-foreground ml-1">/ 30d</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
