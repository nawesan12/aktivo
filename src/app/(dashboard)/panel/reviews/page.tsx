import { ReviewsDashboard } from "@/components/dashboard/reviews-dashboard";
import { PanelHeader } from "@/components/dashboard/panel-header";

export const metadata = {
  title: "Reseñas",
};

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <PanelHeader title="Reseñas" subtitle="Gestiona las reseñas de tus clientes" />
      <ReviewsDashboard />
    </div>
  );
}
