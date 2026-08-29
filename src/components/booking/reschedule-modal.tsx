"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotGrid } from "./time-slot-grid";

interface AvailableDate {
  date: string;
  hasSlots: boolean;
}

interface SlotData {
  time: string;
  display: string;
  available: boolean;
}

interface RescheduleModalProps {
  appointmentId: string;
  slug: string;
  currentDateTime: string;
  serviceDuration: number;
  serviceId: string;
  staffId: string;
  rescheduleUrl: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleModal({
  appointmentId,
  slug,
  currentDateTime,
  serviceDuration,
  serviceId,
  staffId,
  rescheduleUrl,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDisplay, setSelectedDisplay] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Intentional: the extra render is what triggers the entrance transition —
    // the modal must first paint hidden, then flip to visible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
  }, []);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  const { data: availableDates, isLoading: loadingDates } = useSWR<AvailableDate[]>(
    staffId ? `/api/businesses/${slug}/availability?staffId=${staffId}` : null
  );

  const { data: slots, isLoading: loadingSlots } = useSWR<SlotData[]>(
    dateStr && staffId && serviceId && serviceDuration
      ? `/api/businesses/${slug}/availability/slots?staffId=${staffId}&date=${dateStr}&serviceId=${serviceId}&duration=${serviceDuration}`
      : null
  );

  const availableDateSet = new Set(
    availableDates?.filter((d) => d.hasSlots).map((d) => format(new Date(d.date), "yyyy-MM-dd")) ?? []
  );

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d);
    setSelectedTime(null);
    setSelectedDisplay(null);
  };

  const handleTimeSelect = (time: string, display: string) => {
    setSelectedTime(time);
    setSelectedDisplay(display);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedDisplay || submitting) return;
    setSubmitting(true);

    try {
      const newDateTime = `${format(selectedDate, "yyyy-MM-dd")}T${selectedDisplay}`;
      const res = await fetch(rescheduleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, newDateTime }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al reprogramar el turno");
        setSubmitting(false);
        return;
      }

      toast.success("Turno reprogramado correctamente");
      onSuccess();
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 transition-transform duration-200 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold">Reprogramar turno</h2>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current datetime info */}
        <p className="text-sm text-muted-foreground mb-4">
          Turno actual: <span className="font-medium text-foreground">{currentDateTime}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="glass rounded-xl p-4">
            {loadingDates ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={es}
                disabled={(d) => {
                  const key = format(d, "yyyy-MM-dd");
                  const today = format(new Date(), "yyyy-MM-dd");
                  return key < today || !availableDateSet.has(key);
                }}
                modifiers={{
                  available: (d) => availableDateSet.has(format(d, "yyyy-MM-dd")),
                }}
                modifiersClassNames={{
                  available: "font-bold",
                }}
                className="w-full"
              />
            )}
          </div>

          {/* Time slots */}
          <div>
            {!selectedDate && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  Selecciona una fecha para ver los horarios
                </p>
              </div>
            )}

            {selectedDate && loadingSlots && (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {selectedDate && slots && (
              <div>
                <p className="text-sm font-medium mb-3 capitalize">
                  {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <TimeSlotGrid
                  slots={slots}
                  selectedTime={selectedTime}
                  onSelect={handleTimeSelect}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-xl hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || submitting}
            className="px-5 py-2 text-sm font-medium rounded-xl brand-gradient text-white disabled:opacity-50 inline-flex items-center gap-2 transition-opacity"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar reprogramacion
          </button>
        </div>
      </div>
    </div>
  );
}
