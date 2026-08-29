import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  createPdfDocument,
  savePdf,
  autoTable,
  appointmentStatusLabel,
  logPdfExport,
} from "./generate-pdf";
import { formatCurrency } from "@/lib/format";

interface ClientDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  type: string;
  createdAt: string;
  totalSpent: number;
  appointments: {
    id: string;
    serviceName: string;
    staffName: string;
    dateTime: string;
    status: string;
    price: number;
    paymentStatus?: string | null;
    paymentAmount?: number | null;
  }[];
}

export async function exportClientProfilePdf(detail: ClientDetail, businessName: string) {
  const clientName = detail.name || "Sin nombre";
  const { doc, startY } = createPdfDocument(businessName, `Ficha de Cliente — ${clientName}`);

  let y = startY;

  // Client info block
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del cliente", 20, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  const info = [
    `Nombre: ${clientName}`,
    `Teléfono: ${detail.phone || "—"}`,
    `Email: ${detail.email || "—"}`,
    `Cliente desde: ${format(new Date(detail.createdAt), "MMMM yyyy", { locale: es })}`,
    `Total gastado: ${formatCurrency(detail.totalSpent)}`,
  ];
  for (const line of info) {
    doc.text(line, 20, y);
    y += 5;
  }
  y += 4;

  // Appointments table
  doc.setFont("helvetica", "bold");
  doc.text("Historial de turnos", 20, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Servicio", "Profesional", "Fecha", "Estado", "Monto"]],
    body: detail.appointments.map((a) => [
      a.serviceName,
      a.staffName,
      format(new Date(a.dateTime), "dd/MM/yy HH:mm", { locale: es }),
      appointmentStatusLabel[a.status] || a.status,
      `${formatCurrency((a.paymentAmount ?? a.price))}`,
    ]),
    styles: { fontSize: 9, font: "helvetica" },
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 20, right: 20 },
  });

  const safeName = clientName.replace(/[^a-zA-Z0-9áéíóúñ ]/g, "").replace(/\s+/g, "_");
  const filename = `cliente_${safeName}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  savePdf(doc, filename);
  await logPdfExport("client_profile", { clientId: detail.id });
}
