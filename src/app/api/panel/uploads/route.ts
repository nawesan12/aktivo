import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { AuthError } from "@/lib/api-errors";
import { handleApiError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";
import { UPLOAD_KINDS, uploadPathPrefix, type UploadKind } from "@/lib/uploads";

const log = createLogger("uploads");

/**
 * Hands the browser a short-lived token so it can put the file straight into
 * Blob storage.
 *
 * The bytes never pass through here. A function that proxied every upload would
 * burn CPU and wall time on exactly the thing this deployment has the least of,
 * for no benefit: the browser can talk to the store directly, and this route
 * only has to answer "yes, that business may write that path, up to this size,
 * of these types".
 *
 * The limits are set here rather than trusted from the client, because the
 * client is a browser and anybody can send whatever they like to this route.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const kind = (clientPayload ?? "") as UploadKind;
        if (!UPLOAD_KINDS.includes(kind)) {
          throw new Error("Tipo de imagen desconocido");
        }

        // A profile picture belongs to the person and needs nothing more than
        // being signed in: a client who books at a barbershop has an avatar and
        // no business at all. Everything else is a business's image.
        let ownerId: string;
        if (kind === "avatar") {
          const session = await auth();
          if (!session?.user?.id) throw new AuthError();
          ownerId = session.user.id;
        } else {
          const session = await getSessionBusiness();
          await requireBusinessPermission(session, "settings:update");
          ownerId = session.businessId;
        }

        // The path is ours to decide, not the caller's: without this someone
        // could name their upload after another owner's file.
        const prefix = uploadPathPrefix(ownerId, kind);
        if (!pathname.startsWith(prefix)) {
          throw new Error("Ruta de subida inválida");
        }

        return {
          allowedContentTypes: ["image/webp", "image/jpeg", "image/png", "image/svg+xml"],
          // The browser compresses to well under this. The ceiling is here for
          // whoever skips the browser.
          maximumSizeInBytes: 2_000_000,
          // Blob appends a random suffix by default, so replacing an image
          // leaves the old one orphaned. We delete the previous one ourselves
          // and want the path we asked for.
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ ownerId, kind }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Runs after the browser finishes. Nothing to persist here — the URL
        // travels back to the form, which saves it with the rest of the
        // business's settings — but it is the only place a failed upload is
        // visible at all.
        log.info("upload completed", {
          url: blob.url,
          payload: typeof tokenPayload === "string" ? tokenPayload : undefined,
        });
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    // `handleUpload` throws for a rejected token as well as for a genuine
    // failure, and Blob expects a non-2xx so the browser stops.
    log.warn("upload rejected", { reason: error instanceof Error ? error.message : "unknown" });
    return handleApiError(error, "panel:uploads");
  }
}
