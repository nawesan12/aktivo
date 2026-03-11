import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  createPdfDocument,
  savePdf,
  autoTable,
  logPdfExport,
} from "./generate-pdf";

interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  type: "registered" | "guest";
  totalAppointments: number;
  lastAppointment: string | null;
}

export async function exportClientsPdf(clients: Client[], businessName: string) {
  const { doc, startY } = createPdfDocument(businessName, "Listado de Clientes");

  autoTable(doc, {
    startY,
    head: [["Nombre", "Email", "Teléfono", "Turnos", "Último turno", "Tipo"]],
    body: clients.map((c) => [
      c.name || "Sin nombre",
      c.email || "—",
      c.phone || "—",
      String(c.totalAppointments),
      c.lastAppointment
        ? format(new Date(c.lastAppointment), "dd/MM/yy", { locale: es })
        : "—",
      c.type === "registered" ? "Registrado" : "Invitado",
    ]),
    styles: { fontSize: 9, font: "helvetica" },
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 20, right: 20 },
  });

  const filename = `clientes_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  savePdf(doc, filename);
  await logPdfExport("clients", { count: clients.length });
}
