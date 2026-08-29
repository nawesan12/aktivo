import { format } from "date-fns";
import {
  createPdfDocument,
  savePdf,
  autoTable,
  logPdfExport,
} from "./generate-pdf";
import { formatCurrency } from "@/lib/format";

interface ReportsData {
  summary: { totalAppointments: number; totalRevenue: number; totalClients: number };
  byStaff: { name: string; count: number; revenue: number }[];
  byService: { name: string; revenue: number }[];
}

const rangeLabels: Record<string, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
};

export async function exportReportsPdf(
  data: ReportsData,
  range: string,
  businessName: string
) {
  const { doc, startY } = createPdfDocument(
    businessName,
    `Reporte — ${rangeLabels[range] || range}`
  );

  let y = startY;

  // KPIs block
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen", 20, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.text(`Turnos: ${data.summary.totalAppointments}`, 20, y);
  doc.text(
    `Ingresos: ${formatCurrency(data.summary.totalRevenue)}`,
    80,
    y
  );
  doc.text(`Clientes: ${data.summary.totalClients}`, 150, y);
  y += 10;

  // Staff performance table
  if (data.byStaff.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Rendimiento por profesional", 20, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Profesional", "Turnos", "Ingresos"]],
      body: data.byStaff.map((s) => [
        s.name,
        String(s.count),
        `${formatCurrency(s.revenue)}`,
      ]),
      styles: { fontSize: 9, font: "helvetica" },
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 20, right: 20 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Revenue by service table
  if (data.byService.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Ingresos por servicio", 20, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Servicio", "Ingresos"]],
      body: data.byService.map((s) => [
        s.name,
        `${formatCurrency(s.revenue)}`,
      ]),
      styles: { fontSize: 9, font: "helvetica" },
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 20, right: 20 },
    });
  }

  const filename = `reporte_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  savePdf(doc, filename);
  await logPdfExport("reports", { range });
}
