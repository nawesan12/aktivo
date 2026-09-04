/**
 * Where uploaded images live, and what may be uploaded at all.
 *
 * Replaces the Cloudinary helpers. The store is Vercel Blob: the browser
 * compresses the file to WebP and puts it there directly, so nothing about an
 * upload costs a function invocation beyond the token request.
 */

export const UPLOAD_KINDS = ["logo", "cover", "gallery", "avatar", "service", "staff"] as const;

export type UploadKind = (typeof UPLOAD_KINDS)[number];

/**
 * The prefix an owner is allowed to write under.
 *
 * Keyed by id rather than slug: a slug can change, and an image whose path no
 * longer matches its owner is an image nobody can safely delete.
 *
 * A profile picture belongs to the person, not to a business — someone who
 * books at a barbershop has an avatar and no business at all — so it lives
 * under its own root and needs nothing more than being signed in.
 */
export function uploadPathPrefix(ownerId: string, kind: UploadKind): string {
  return kind === "avatar" ? `usuarios/${ownerId}/avatar/` : `negocios/${ownerId}/${kind}/`;
}

/** The host Blob serves from, for the `next/image` allowlist. */
export const BLOB_HOSTNAME_SUFFIX = ".public.blob.vercel-storage.com";

export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOSTNAME_SUFFIX);
  } catch {
    return false;
  }
}
