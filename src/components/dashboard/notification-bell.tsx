"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusColors: Record<string, string> = {
  SENT: "bg-emerald-500",
  FAILED: "bg-red-500",
  PENDING: "bg-yellow-500",
};

const typeLabels: Record<string, string> = {
  confirmation: "Confirmacion",
  reminder: "Recordatorio",
  cancellation: "Cancelacion",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useSWR("/api/panel/notifications/unread", fetcher, {
    refreshInterval: 30000,
  });

  const items = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full brand-gradient text-white text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm">Notificaciones</h3>
        </div>
        <ScrollArea className="max-h-80">
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
                          {typeLabels[item.type as string] || (item.type as string)} via {(item.channel as string)?.toLowerCase()}
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
        </ScrollArea>
        <div className="px-4 py-2.5 border-t border-border">
          <Link
            href="/panel/notificaciones"
            onClick={() => setOpen(false)}
            className="text-xs text-primary hover:underline"
          >
            Ver todas las notificaciones
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
