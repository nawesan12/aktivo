/**
 * Shared formatting helpers.
 *
 * Money was being formatted in 26 places with three different results —
 * `$12.500`, `$ 12.500` and `$12.500,00` — sometimes two of them on the same
 * screen. Prices are the thing a customer looks at hardest; they should not
 * change shape between the service card and the confirmation.
 */

const DEFAULT_LOCALE = "es-AR";
const DEFAULT_CURRENCY = "ARS";

/**
 * `Intl` separates the symbol from the amount with a non-breaking space, which
 * some PDF fonts render as a black square. A normal space is indistinguishable
 * on screen and safe everywhere.
 */
function normalise(value: string): string {
  return value.replace(/ /g, " ");
}

/**
 * Prices in Argentina are quoted whole: cents are noise on a $12.500 haircut.
 * Pass `decimals` when reporting a figure that genuinely has them.
 */
export function formatCurrency(
  value: number,
  { currency = DEFAULT_CURRENCY, decimals = 0 }: { currency?: string; decimals?: number } = {}
): string {
  if (!Number.isFinite(value)) return formatCurrency(0, { currency, decimals });

  return normalise(
    new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  );
}

/** Thousands separators, no currency symbol. */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "0";

  return normalise(
    new Intl.NumberFormat(DEFAULT_LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  );
}

/** A percentage as it should read next to a KPI: `12,5%`. */
export function formatPercent(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "0%";
  return `${formatNumber(value, decimals)}%`;
}
