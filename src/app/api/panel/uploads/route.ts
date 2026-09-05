import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { AppError, AuthError, ValidationError, handleApiError } from "@/lib/api-errors";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { UPLOAD_KINDS, uploadPathPrefix, type UploadKind } from "@/lib/uploads";

const log = createLogger("uploads");

/** What the store will accept. The browser sends WebP; the rest are fallbacks. */
const ALLOWED_TYPES = ["image/webp", "image/jpeg", "image/png", "image/svg+xml"];

/**
 * The ceiling, in bytes.
 *
 * The browser compresses to well under this — a logo lands around 30 KB, a
 * cover under 160 KB. This is here for whoever skips the browser.
 */
const MAX_BYTES = 2_000_000;

/**
 * Takes the compressed image and puts it in Blob storage.
 *
 * This used to hand the browser a token so it could write to the store
 * directly, which is what the SDK is built for. It did not work: the PUT goes
 * to `vercel.com`, cross-origin, and on iOS Safari it never completed — the
 * request died at the network layer with nothing to go on, and the SDK's own
 * retry loop hid it behind seventeen minutes of silence. Desktop browsers were
 * fine, which is the worst kind of bug to own.
 *
 * Going through here costs no more than that did. The token request was already
 * one function invocation, so this is the same one, and what it carries is an
 * image the browser has already scaled and re-encoded — 30 to 160 KB, not the
 * three megabytes off the camera. No `sharp`, no decoding, no CPU worth
 * counting: the function hands the bytes to the store and answers. Direct
 * client upload earns its keep on large files; this is not that, and it cost us
 * a feature that did not work on half the phones our customers use.
 *
 * The limits stay here rather than being trusted from the client, because the
 * client is a browser and anybody can post whatever they like to this route.
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "") as UploadKind;

    if (!UPLOAD_KINDS.includes(kind)) {
      throw new ValidationError("Tipo de imagen desconocido");
    }

    if (!(file instanceof File)) {
      throw new ValidationError("No llegó ninguna imagen");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError("Ese formato de imagen no se puede subir");
    }

    if (file.size > MAX_BYTES) {
      throw new ValidationError("La imagen es demasiado grande");
    }

    // A profile picture belongs to the person and needs nothing more than being
    // signed in: a client who books at a barbershop has an avatar and no
    // business at all. Everything else is a business's image.
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

    // The path is ours to decide, not the caller's: without this someone could
    // name their upload after another owner's file. Only the extension survives
    // from what was sent, and only from a fixed list.
    const extension = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
    const name = `${Date.now()}.${extension}`;

    // The token is passed rather than left to be discovered. The SDK looks for
    // OIDC *before* `BLOB_READ_WRITE_TOKEN`, and on Vercel a function is handed
    // a `VERCEL_OIDC_TOKEN` whether or not the store trusts it — so with
    // `BLOB_STORE_ID` also set, every upload authenticated as OIDC and failed,
    // while the token that was actually configured sat unread.
    if (!env.BLOB_READ_WRITE_TOKEN) {
      throw new AppError("El almacenamiento de imágenes no está configurado", 503);
    }

    let blob;
    try {
      blob = await put(`${uploadPathPrefix(ownerId, kind)}${name}`, file, {
        access: "public",
        contentType: file.type,
        token: env.BLOB_READ_WRITE_TOKEN,
        // The name already carries a timestamp, so nothing collides, and the
        // URL stays the one we asked for — which is what makes the old file
        // findable and deletable when an image is replaced.
        addRandomSuffix: false,
      });
    } catch (error) {
      // The store's own wording, forwarded. Swallowing it into "Error interno"
      // is how this took four attempts to diagnose: the reason was always in
      // the message, and never anywhere the owner or we could read it.
      const detail = error instanceof Error ? error.message : "sin detalle";
      log.error("store refused the upload", error);
      throw new AppError(`El almacenamiento rechazó la imagen: ${detail}`, 502);
    }

    log.info("upload stored", { kind, ownerId, bytes: file.size, url: blob.url });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    return handleApiError(error, "panel:uploads");
  }
}
