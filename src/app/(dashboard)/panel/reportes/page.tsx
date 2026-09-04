import type { Metadata } from "next";

import { ReportsDashboard } from "@/components/dashboard/reports-dashboard";

export const metadata: Metadata = {
  title: "Reportes",
};

/**
 * No more `next/dynamic`: Recharts is gone from this screen. The heatmap, the
 * revenue bars and the service donut are CSS — a grid, four rounded rects and a
 * conic-gradient — which is 318 KB of JavaScript the panel no longer ships to
 * draw about forty rectangles.
 *
 * The heading lives inside the component: the range switcher sits on its row.
 */
export default function ReportesPage() {
  return <ReportsDashboard />;
}
