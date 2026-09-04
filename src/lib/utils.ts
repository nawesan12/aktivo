import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** The RGB channels of a hex colour, or null when it is not one. */
function hexChannels(hex: string): { r: number; g: number; b: number } | null {
  if (hex.length === 4) {
    return {
      r: parseInt(hex[1] + hex[1], 16),
      g: parseInt(hex[2] + hex[2], 16),
      b: parseInt(hex[3] + hex[3], 16),
    };
  }
  if (hex.length === 7) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }
  return null;
}

/**
 * Black or white, whichever can be read on top of this colour.
 *
 * A business picking a pale yellow gets dark text on its buttons; one picking
 * navy gets white. Without this, `--primary-foreground` stays whatever Jiku's
 * theme set and half the palettes produce unreadable buttons.
 *
 * Uses the WCAG relative luminance, not the naive average: green weighs far
 * more than blue in how bright a colour looks.
 */
export function contrastColor(hex: string): string {
  const channels = hexChannels(hex);
  if (!channels) return "#09090b";

  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  const luminance =
    0.2126 * channel(channels.r) +
    0.7152 * channel(channels.g) +
    0.0722 * channel(channels.b);

  return luminance > 0.45 ? "#09090b" : "#fafafa";
}

/** True for `#RGB` or `#RRGGBB`. Anything else must not reach a stylesheet. */
export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

/**
 * A URL-safe form of a piece of text.
 *
 * Signup already had this inline for business names; the city landing pages
 * need the same rules so "Mar del Plata" and "Ciudad Autónoma de Buenos Aires"
 * become addresses that survive a paste into WhatsApp.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
