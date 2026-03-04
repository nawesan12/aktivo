"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Save, Loader2, Plus, X, Clock, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

interface WorkingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface BlockedDate {
  date: string;
  type: "FULL_DAY" | "PARTIAL";
  startTime?: string;
  endTime?: string;
  reason?: string;
}

interface RecurringBlock {
  dayOfWeek: number;
  time: string;
}

export function ScheduleEditor() {
  const { data: staffData, isLoading: loadingStaff } = useSWR("/api/panel/staff", fetcher);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringBlock[]>([]);

  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [newRecurringDay, setNewRecurringDay] = useState(1);
  const [newRecurringTime, setNewRecurringTime] = useState("13:00");

  const staff = staffData?.data || [];

  const { data: scheduleData, isLoading: loadingSchedule } = useSWR(
    selectedStaffId ? `/api/panel/staff/${selectedStaffId}/schedule` : null,
    fetcher
  );

  useEffect(() => {
    if (staff.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staff[0].id);
    }
  }, [staff, selectedStaffId]);

  useEffect(() => {
    if (scheduleData) {
      // Ensure all 7 days have entries
      const hours: WorkingHour[] = Array.from({ length: 7 }, (_, i) => {
        const existing = scheduleData.workingHours?.find((wh: WorkingHour) => wh.dayOfWeek === i);
        return existing || { dayOfWeek: i, startTime: "09:00", endTime: "18:00", isActive: false };
      });
      setWorkingHours(hours);
      setBlockedDates(
        (scheduleData.blockedDates || []).map((bd: { date: string; type: string; reason?: string }) => ({
          ...bd,
          date: format(new Date(bd.date), "yyyy-MM-dd"),
        }))
      );
      setRecurringBlocks(scheduleData.recurringBlocks || []);
    }
  }, [scheduleData]);

  function updateHour(dayOfWeek: number, field: string, value: string | boolean) {
    setWorkingHours((prev) =>
      prev.map((wh) => (wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh))
    );
  }

  function addBlockedDate() {
    if (!newBlockDate) return;
    setBlockedDates((prev) => [
      ...prev,
      { date: newBlockDate, type: "FULL_DAY", reason: newBlockReason || undefined },
    ]);
    setNewBlockDate("");
    setNewBlockReason("");
  }

  function removeBlockedDate(index: number) {
    setBlockedDates((prev) => prev.filter((_, i) => i !== index));
  }

  function addRecurringBlock() {
    setRecurringBlocks((prev) => [
      ...prev,
      { dayOfWeek: newRecurringDay, time: newRecurringTime },
    ]);
  }

  function removeRecurringBlock(index: number) {
    setRecurringBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/panel/staff/${selectedStaffId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingHours, blockedDates, recurringBlocks }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Horarios guardados");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loadingStaff) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      {/* Staff selector */}
      <div className="flex flex-wrap gap-2">
        {staff.map((s: { id: string; name: string }) => (
          <button
            key={s.id}
            onClick={() => setSelectedStaffId(s.id)}
            className={`h-9 px-4 rounded-lg text-sm font-medium border transition-colors ${
              selectedStaffId === s.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/30 border-border hover:bg-muted/50"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {!selectedStaffId ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">Selecciona un profesional</p>
        </div>
      ) : loadingSchedule ? (
        <FormSkeleton />
      ) : (
        <>
          {/* Working hours */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Horarios de atencion
            </h3>
            <div className="space-y-3">
              {workingHours.map((wh) => (
                <div key={wh.dayOfWeek} className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 w-32">
                    <input
                      type="checkbox"
                      checked={wh.isActive}
                      onChange={(e) => updateHour(wh.dayOfWeek, "isActive", e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm font-medium">{DAYS[wh.dayOfWeek]}</span>
                  </label>
                  {wh.isActive && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={wh.startTime}
                        onChange={(e) => updateHour(wh.dayOfWeek, "startTime", e.target.value)}
                        className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">a</span>
                      <input
                        type="time"
                        value={wh.endTime}
                        onChange={(e) => updateHour(wh.dayOfWeek, "endTime", e.target.value)}
                        className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recurring lunch/break blocks */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-heading font-semibold mb-4">Bloques recurrentes (almuerzo, descansos)</h3>
            <div className="space-y-3">
              {recurringBlocks.map((rb, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <span className="text-sm">{DAYS[rb.dayOfWeek]}</span>
                  <span className="text-sm text-muted-foreground">{rb.time}</span>
                  <button onClick={() => removeRecurringBlock(i)} className="ml-auto w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Dia</label>
                  <select
                    value={newRecurringDay}
                    onChange={(e) => setNewRecurringDay(parseInt(e.target.value))}
                    className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm"
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hora</label>
                  <input
                    type="time"
                    value={newRecurringTime}
                    onChange={(e) => setNewRecurringTime(e.target.value)}
                    className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm"
                  />
                </div>
                <button onClick={addRecurringBlock} className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Blocked dates */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <CalendarOff className="w-4 h-4" /> Fechas bloqueadas
            </h3>
            <div className="space-y-3">
              {blockedDates.map((bd, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <span className="text-sm">{format(new Date(bd.date + "T12:00:00"), "dd/MM/yyyy", { locale: es })}</span>
                  {bd.reason && <span className="text-xs text-muted-foreground">— {bd.reason}</span>}
                  <button onClick={() => removeBlockedDate(i)} className="ml-auto w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
                  <input
                    type="date"
                    value={newBlockDate}
                    onChange={(e) => setNewBlockDate(e.target.value)}
                    className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Motivo (opcional)</label>
                  <input
                    type="text"
                    value={newBlockReason}
                    onChange={(e) => setNewBlockReason(e.target.value)}
                    placeholder="Ej: Vacaciones"
                    className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
                  />
                </div>
                <button onClick={addBlockedDate} className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar horarios
            </button>
          </div>
        </>
      )}
    </div>
  );
}
