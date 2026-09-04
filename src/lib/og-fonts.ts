/**
 * Font data for `ImageResponse`.
 *
 * Satori needs the raw bytes, and `next/font` only hands out CSS class names —
 * so the file is fetched from Google directly. The old-browser user agent is
 * what makes Google answer with WOFF rather than WOFF2, which Satori cannot
 * read.
 *
 * These images are prerendered, so the fetch happens once at build time and
 * never on a visitor's request.
 */
const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko) Version/5.1 Safari/534.30";

export async function loadGoogleFont(
  family: string,
  weight: number,
  { italic = false } = {}
): Promise<ArrayBuffer> {
  const style = italic ? ":ital,wght@1," : ":wght@";
  const url =
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}` +
    `${style}${weight}&display=swap`;

  const css = await fetch(url, { headers: { "User-Agent": LEGACY_UA } }).then((r) => r.text());

  const source = css.match(/src: url\((.+?)\) format\('(woff|opentype|truetype)'\)/)?.[1];
  if (!source) {
    throw new Error(`No se pudo resolver la fuente ${family} ${weight}`);
  }

  return fetch(source).then((r) => r.arrayBuffer());
}
