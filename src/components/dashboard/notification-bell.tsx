"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


const statusColors: Record<string, string> = {
  SENT: "bg-success",
  FAILED: "bg-danger",
  PENDING: "bg-warning",
};

const typeLabels: Record<string, string> = {
  confirmation: "Confirmación",
  reminder: "Recordatorio",
  cancellation: "Cancelación",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  /**
   * No polling.
   *
   * This sits in the topbar of all 21 panel pages, so a 30-second interval was
   * 960 invocations and about 1900 queries a day for one owner leaving the
   * panel open — for a counter that changes a handful of times a day. It now
   * refreshes when the tab regains focus and when the popover is opened, which
   * is when anyone actually looks at it.
   */
  const { data, mutate } = useSWR("/api/panel/notifications/unread", {
    revalidateOnFocus: true,
  });

  const items = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) mutate();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notificaciones, ${unreadCount} sin leer`
              : "Notificaciones"
          }
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              // The count is already in the button's label; announcing the badge
              // as well would read it twice.
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full brand-gradient text-white text-[10px] font-bold flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/*
          Lo que es: el registro de lo que se le mandó a cada cliente. Bajo el
          título "Notificaciones" se leía como avisos para el dueño, y no lo
          son — nada acá pide que haga algo.
        */}
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm">Envíos a tus clientes</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Los correos que salieron por tus turnos.
          </p>
        </div>
        {/*
          `max-h` propio, no ScrollArea.

          El viewport interno de Radix es `h-full`, y `h-full` dentro de un
          padre sin altura definida no acota nada: la lista crecía con los
          ítems y se derramaba fuera del popover, encima del dashboard, hasta
          el pie de la pantalla.
        */}
        <div className="max-h-80 overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Sin notificaciones recientes</p>
            </div>
          ) : (
            <div className="py-1">
              {items.map((item: Record<string, unknown>) => (
                <div key={item.id as string} className="px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColors[item.status as string] || "bg-muted"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{item.clientName as string || "Cliente"}</span>
                        {" — "}
                        <span className="text-muted-foreground">
                          {typeLabels[item.type as string] || (item.type as string)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.createdAt as string), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-border">
          <Link
            href="/panel/notificaciones"
            onClick={() => setOpen(false)}
            className="text-xs text-primary hover:underline"
          >
            Ver todos los envíos
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
