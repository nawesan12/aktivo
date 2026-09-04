import { redirect } from "next/navigation";

/**
 * Absorbed into Configuración. The route stays because links to it are out in
 * the world — in the sidebar people remember, in bookmarks, in old emails.
 */
export default function Page() {
  redirect("/panel/configuracion?s=sucursales");
}
