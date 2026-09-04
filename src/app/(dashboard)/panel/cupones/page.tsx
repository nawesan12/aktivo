import { redirect } from "next/navigation";

/** Absorbed into /panel/membresias as its second tab. */
export default function CuponesPage() {
  redirect("/panel/membresias?tab=cupones");
}
