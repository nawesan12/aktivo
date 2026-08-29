/**
 * Rendered inside an iframe on a customer's own website, so it stays small and
 * says nothing about Jiku's other pages — there is nowhere to navigate to from
 * inside the frame.
 */
export default function WidgetNotFound() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
      <div>
        <p className="font-heading font-semibold mb-1">Reservas no disponibles</p>
        <p className="text-sm text-muted-foreground">
          Este negocio no tiene las reservas online habilitadas en este momento.
        </p>
      </div>
    </div>
  );
}
