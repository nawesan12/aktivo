import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
  APPOINTMENT_STATUS_ORDER,
  APPOINTMENT_STATUS_STYLES,
} from "@/lib/appointment-status";

// Re-export autoTable so consumers don't need to import it separately
export { autoTable };

// ─── Status label maps (Spanish) ────────────────────────────────
/** Same labels the interface shows, so an exported PDF matches the screen. */
export const appointmentStatusLabel: Record<string, string> = Object.fromEntries(
  APPOINTMENT_STATUS_ORDER.map((status) => [status, APPOINTMENT_STATUS_STYLES[status].label])
);

export const paymentStatusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  REFUNDED: "Reembolsado",
};

// ─── Document creation ──────────────────────────────────────────
const MARGIN = 20;

export function createPdfDocument(businessName: string, title: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Business name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(businessName, MARGIN, MARGIN + 5);

  // Title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(title, MARGIN, MARGIN + 13);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generado: ${format(new Date(), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}`,
    MARGIN,
    MARGIN + 20
  );
  doc.setTextColor(0, 0, 0);

  return { doc, startY: MARGIN + 28 };
}

// ─── Footer ─────────────────────────────────────────────────────
export function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
}

// ─── Save helper ────────────────────────────────────────────────
export function savePdf(doc: jsPDF, filename: string) {
  addFooter(doc);
  doc.save(filename);
}

// ─── Audit helper ───────────────────────────────────────────────
export async function logPdfExport(entity: string, details?: Record<string, unknown>) {
  try {
    await fetch("/api/panel/reports/audit-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, details }),
    });
  } catch {
    // Non-blocking — don't break the export if audit fails
  }
}
