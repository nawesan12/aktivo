/**
 * Squeezing an image down in the browser, before it ever leaves the phone.
 *
 * Compressing on the server would mean the full file travelling into a function
 * and `sharp` burning CPU there — the two resources this deployment is most
 * careful with. Doing it here costs nothing on our side, and the upload itself
 * gets faster on the mobile connection the owner is actually on.
 *
 * What comes out is WebP, bounded in both dimensions and in bytes. Measured on
 * real material: a flat barber's logo lands around 6 KB, a face around 35 KB,
 * and a 12-megapixel phone photo of the shop goes from 2.8 MB to about 150 KB
 * in the worst case and well under 100 KB in the usual one. Small enough that
 * the image never needs optimising again on the way out, which is a billed
 * transformation saved on every view.
 *
 * Lossless PNG was measured against this for logos, on the theory that flat
 * colour compresses better without loss. It does not: the same logo is 6 KB as
 * lossy WebP and 20 KB as PNG. WebP wins even here.
 *
 * Re-encoding also drops every EXIF field the camera wrote, which includes the
 * GPS coordinates of wherever the photo was taken. Nobody uploading a picture of
 * their shop expects to publish its location twice.
 */

export interface CompressOptions {
  /** Longest side, in pixels. Anything bigger is scaled down to it. */
  maxDimension: number;
  /** Target ceiling in bytes. Quality steps down until the result fits. */
  maxBytes: number;
}

/** Sensible ceilings per kind of image, so callers do not invent their own. */
export const IMAGE_BUDGETS = {
  /** Shown at 128px at the very most. */
  logo: { maxDimension: 512, maxBytes: 60_000 },
  /** Full-bleed behind the business name. */
  cover: { maxDimension: 1600, maxBytes: 160_000 },
  /** Grid thumbnails that open no larger than the screen. */
  gallery: { maxDimension: 1280, maxBytes: 140_000 },
  /** A face in a circle. */
  avatar: { maxDimension: 400, maxBytes: 40_000 },
} as const satisfies Record<string, CompressOptions>;

export type ImageKind = keyof typeof IMAGE_BUDGETS;

const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52, 0.42];

/** Whether this browser can encode WebP. Every current one can; Safari 13 cannot. */
function supportsWebP(): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export interface CompressedImage {
  file: File;
  /** For reporting: how much smaller it got. */
  originalBytes: number;
  bytes: number;
  width: number;
  height: number;
}

export async function compressImage(
  input: File,
  kind: ImageKind
): Promise<CompressedImage> {
  const { maxDimension, maxBytes } = IMAGE_BUDGETS[kind];

  // An SVG is already tiny and vector: rasterising it would make it bigger and
  // worse. It passes through untouched.
  if (input.type === "image/svg+xml") {
    return {
      file: input,
      originalBytes: input.size,
      bytes: input.size,
      width: 0,
      height: 0,
    };
  }

  // `createImageBitmap` decodes off the main thread, so a 12-megapixel photo
  // from a phone camera does not freeze the interface while it loads.
  //
  // `from-image` applies the EXIF orientation flag. Without it every portrait
  // photo taken on an iPhone uploads on its side: the browser shows it upright
  // in a file picker, because that path honours the flag, and the canvas does
  // not — so it looks right until the moment it is published.
  const bitmap = await createImageBitmap(input, { imageOrientation: "from-image" });

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("No pudimos procesar la imagen en este navegador");
  }

  // Better downscaling than the default nearest-neighbour, which makes a
  // shrunk logo look ragged.
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  // A white bed under anything transparent: a PNG logo with a transparent
  // background turns black when encoded to a format without alpha, and it is
  // the single most common upload here.
  const type = supportsWebP() ? "image/webp" : "image/jpeg";
  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let best: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    const blob = await toBlob(canvas, type, quality);
    if (!blob) continue;
    best = blob;
    // Stop at the first quality that fits: every further step is visible loss
    // bought for bytes we did not need to save.
    if (blob.size <= maxBytes) break;
  }

  if (!best) throw new Error("No pudimos comprimir la imagen");

  const extension = type === "image/webp" ? "webp" : "jpg";
  const name = input.name.replace(/\.[^.]+$/, "") || "imagen";

  return {
    file: new File([best], `${name}.${extension}`, { type }),
    originalBytes: input.size,
    bytes: best.size,
    width,
    height,
  };
}

/** "2,4 MB → 38 KB", for telling the person what just happened. */
export function describeSaving(result: CompressedImage): string {
  const kb = (bytes: number) =>
    bytes >= 1_000_000
      ? `${(bytes / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} MB`
      : `${Math.round(bytes / 1000)} KB`;

  return `${kb(result.originalBytes)} → ${kb(result.bytes)}`;
}
