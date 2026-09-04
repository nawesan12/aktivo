/**
 * Image hosts `next/image` is allowed to optimise.
 *
 * Must stay in sync with `images.remotePatterns` in `next.config.ts`.
 */
const ALLOWED_HOSTS = new Set([
  // Kept for anything uploaded before the move to Vercel Blob.
  "res.cloudinary.com",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
]);

/** Uploads live on a per-store subdomain, so the host is matched by suffix. */
const ALLOWED_HOST_SUFFIXES = [".public.blob.vercel-storage.com"];

/**
 * Returns the URL only if `next/image` can render it, and null otherwise.
 *
 * `next/image` does not degrade when it is handed a host that is not in
 * `remotePatterns`: it throws, and the throw takes down the whole page. Business
 * images come out of the database, where a URL can be anything — an old seed
 * row, a paste from somewhere else, an import. One bad row should cost a broken
 * thumbnail, not a broken storefront.
 *
 * Relative paths (`/jiku-logo.svg`) are served from the app itself and always
 * pass.
 */
export function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;

  try {
    const { hostname } = new URL(url);
    if (ALLOWED_HOSTS.has(hostname)) return url;
    if (ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return url;
    return null;
  } catch {
    return null;
  }
}
