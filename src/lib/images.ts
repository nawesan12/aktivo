/**
 * Image hosts `next/image` is allowed to optimise.
 *
 * Must stay in sync with `images.remotePatterns` in `next.config.ts`.
 */
const ALLOWED_HOSTS = new Set([
  "res.cloudinary.com",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
]);

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
    return ALLOWED_HOSTS.has(new URL(url).hostname) ? url : null;
  } catch {
    return null;
  }
}
