import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  createPdfDocument,
  savePdf,
  autoTable,
  appointmentStatusLabel,
  paymentStatusLabel,
  logPdfExport,
} from "./generate-pdf";

interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: string;
  status: string;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
  servicePrice: number;
}

export async function exportAppointmentsPdf(appointments: Appointment[], businessName: string) {
  const { doc, startY } = createPdfDocument(businessName, "Listado de Turnos");

  autoTable(doc, {
    startY,
    head: [["Fecha", "Hora", "Cliente", "Servicio", "Profesional", "Estado", "Pago", "Monto"]],
    body: appointments.map((a) => [
      format(new Date(a.dateTime), "dd/MM/yy", { locale: es }),
      format(new Date(a.dateTime), "HH:mm"),
      a.clientName,
      a.serviceName,
      a.staffName,
      appointmentStatusLabel[a.status] || a.status,
      paymentStatusLabel[a.paymentStatus || ""] || "—",
      `$${(a.paymentAmount ?? a.servicePrice).toLocaleString("es-AR")}`,
    ]),
    styles: { fontSize: 8, font: "helvetica" },
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 14 },
    },
  });

  const filename = `turnos_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  savePdf(doc, filename);
  await logPdfExport("appointments", { count: appointments.length });
}
