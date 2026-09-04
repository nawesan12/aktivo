import { cn } from "@/lib/utils";

const AGENDA = [
  { time: "10:00", name: "Lucía Fernández", detail: "Corte + Color · Nico R.", spine: "bg-primary", pill: "bg-success-muted text-jade-label", label: "CONFIRMADO" },
  { time: "11:30", name: "Matías López", detail: "Barba + Degradé · Agus G.", spine: "bg-warning", pill: "bg-warning-muted text-warning-foreground", label: "PENDIENTE" },
  { time: "12:15", name: "Camila Ruiz", detail: "Alisado definitivo · Nico R.", spine: "bg-info", pill: "bg-info-muted text-info-foreground", label: "$ SEÑADO" },
];

const MINI_NAV = ["Hoy", "Calendario", "Clientes", "Pagos", "Cupones", "Reportes"];

/**
 * The panel, shown rather than described.
 *
 * The hero used to end on a CSS phone mockup tilted in 3D; this is the actual
 * shape of the product — sidebar, the day's agenda, and the column where things
 * land while the shop is closed. It is decorative markup, not a live panel, so
 * it is a plain server component with no data behind it.
 */
export function ProductWindow() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_70px_-28px_rgba(9,9,11,0.22)]"
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-3">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-primary" />
        <span className="ml-2.5 font-mono text-[11px] text-faint">jikuapp.com/panel</span>
        <span className="ml-auto hidden items-center gap-[7px] rounded-full bg-primary/[0.12] px-3 py-1 text-[10px] font-semibold text-jade-label sm:flex">
          <span className="size-[5px] rounded-full bg-jade-link" />
          Agenda abierta
        </span>
      </div>

      <div className="grid min-h-[330px] lg:grid-cols-[200px_1fr_260px]">
        <div className="hidden flex-col gap-0.5 border-r border-border-subtle bg-background p-3 text-xs lg:flex">
          {MINI_NAV.map((item, index) => (
            <span
              key={item}
              className={cn(
                "rounded-lg px-2.5 py-2",
                index === 0 ? "bg-jade-fill font-semibold text-jade-label" : "text-muted-foreground"
              )}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-base font-bold">Studio Martín · jueves 4</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                <b className="text-[15px] text-jade-label">18</b> turnos
              </span>
              <span>
                <b className="text-[15px] text-foreground">$284k</b> mes
              </span>
              <span>
                <b className="text-[15px] text-foreground">92%</b> ocupación
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            {AGENDA.map((row) => (
              <div
                key={row.time}
                className="flex items-center gap-3 rounded-[10px] border border-border-subtle bg-background px-3.5 py-[11px]"
              >
                <span className="min-w-10 text-xs font-bold tabular-nums">{row.time}</span>
                <span className={cn("h-7 w-[3px] rounded", row.spine)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{row.name}</p>
                  <p className="truncate text-[10.5px] text-muted-foreground">{row.detail}</p>
                </div>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-full px-2.5 py-[3px] text-[9px] font-bold sm:block",
                    row.pill
                  )}
                >
                  {row.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden border-l border-border-subtle bg-background p-5 lg:block">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-faint">
            Entrando ahora
          </p>
          <div className="mb-2 rounded-xl border border-primary/50 bg-card p-3">
            <p className="mb-0.5 text-[10px] text-faint">Nueva reserva · 2:47 AM</p>
            <p className="text-xs font-semibold text-jade-label">Sofía reservó Manicura</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Seña $2.100 acreditada</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-card p-3">
            <p className="mb-0.5 text-[10px] text-faint">Lista de espera</p>
            <p className="text-xs font-semibold">3 personas quieren el hueco del sábado 11:30</p>
          </div>
        </div>
      </div>
    </div>
  );
}
