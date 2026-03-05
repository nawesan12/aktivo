import { ReviewsDashboard } from "@/components/dashboard/reviews-dashboard";

export const metadata = {
  title: "Reseñas | Jiku",
};

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reseñas</h1>
        <p className="text-muted-foreground">Gestiona las reseñas de tus clientes</p>
      </div>
      <ReviewsDashboard />
    </div>
  );
}
