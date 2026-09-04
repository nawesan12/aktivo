import { redirect } from "next/navigation";

/**
 * Absorbed into /panel/equipo as its second tab. The route stays because links
 * to it are out in the world — in the onboarding, in bookmarks, in old emails.
 */
export default function HorariosPage() {
  redirect("/panel/equipo?tab=horarios");
}
