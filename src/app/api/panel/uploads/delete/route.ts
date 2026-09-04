import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, AuthError, ValidationError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";
import { isBlobUrl } from "@/lib/uploads";

const log = createLogger("uploads:delete");

const bodySchema = z.object({ url: z.string().url() });

/**
 * Removes a file from the store.
 *
 * Without this every replaced logo stays forever: the store fills with images
 * nothing points at, and nobody can tell which of them are still in use.
 *
 * The path is what authorises the delete. A URL is only removable by whoever
 * owns the folder it sits in — the business for its own images, the person for
 * their own avatar — so one business cannot delete another's photos by pasting
 * their URL here.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = bodySchema.parse(await request.json());

    if (!isBlobUrl(url)) {
      throw new ValidationError("Esa imagen no está en nuestro almacenamiento");
    }

    const path = new URL(url).pathname.replace(/^\//, "");

    if (path.startsWith("usuarios/")) {
      const session = await auth();
      if (!session?.user?.id) throw new AuthError();
      if (!path.startsWith(`usuarios/${session.user.id}/`)) {
        throw new ValidationError("Esa imagen no es tuya");
      }
    } else if (path.startsWith("negocios/")) {
      const session = await getSessionBusiness();
      await requireBusinessPermission(session, "settings:update");
      if (!path.startsWith(`negocios/${session.businessId}/`)) {
        throw new ValidationError("Esa imagen no es de tu negocio");
      }
    } else {
      throw new ValidationError("Ruta desconocida");
    }

    await del(url);
    log.info("blob deleted", { path });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "panel:uploads:delete");
  }
}
