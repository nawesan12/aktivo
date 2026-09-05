/**
 * Argentine phone numbers.
 *
 * Normalisation used to live privately inside the notification senders, and
 * validation was `z.string().min(10)` — which accepts "0000000000" and
 * rejects a perfectly valid number typed as "+54 9 223 632-7551". A wrong phone
 * number means the confirmation never arrives and the customer never learns the
 * booking exists.
 *
 * Shape of a mobile number here:
 *
 *   +54 9 <area code: 2-4 digits> <subscriber: 6-8 digits>
 *
 * Area code and subscriber number always add up to 10 digits. The `9` marks a
 * mobile line for international dialling.
 */

const COUNTRY_CODE = "54";

/** Digits only, no country code, no leading zero, no mobile `15`. */
export function nationalDigits(input: string): string {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(COUNTRY_CODE) && digits.length > 10) {
    digits = digits.slice(COUNTRY_CODE.length);
  }
  // International mobile marker, only meaningful with the country code.
  if (digits.length === 11 && digits.startsWith("9")) digits = digits.slice(1);
  // Long-distance prefix when dialling from a landline.
  if (digits.startsWith("0")) digits = digits.slice(1);
  // "15" is how mobiles are dialled locally: 223 15 632-7551.
  if (digits.length === 12 && digits.slice(3, 5) === "15") {
    digits = digits.slice(0, 3) + digits.slice(5);
  }

  return digits;
}

export function isValidArgentinePhone(input: string): boolean {
  const digits = nationalDigits(input);

  if (digits.length !== 10) return false;
  // No valid area code starts with 0, and a repeated digit is a placeholder.
  if (digits.startsWith("0")) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false;

  return true;
}

/** Canonical storage form: `+54 9 2236327551`, unambiguous and dialable. */
export function normalisePhone(input: string): string {
  const digits = nationalDigits(input);
  if (digits.length !== 10) return input.trim();
  return `+${COUNTRY_CODE}9${digits}`;
}

/**
 * Argentine area codes with three digits.
 *
 * There is no rule that separates a three-digit code from a four-digit one —
 * the total is always ten either way — so it takes a list. This one is short
 * and stable: 11 is the only two-digit code, these are the three-digit ones,
 * and everything else has four. Without it, a number from Río Gallegos
 * (2966) was split as if it were 296, and read as somebody else's town.
 */
const THREE_DIGIT_AREA_CODES = new Set([
  "220", "221", "223", "230", "236", "237", "245", "249",
  "260", "261", "263", "264", "266", "280", "291", "297", "299",
  "336", "341", "342", "343", "345", "348",
  "351", "353", "358", "362", "364", "370", "376", "379",
  "380", "381", "383", "385", "387", "388",
]);

/** Readable form for the interface: `223 632-7551`. */
export function formatPhoneForDisplay(input: string): string {
  const digits = nationalDigits(input);
  if (digits.length !== 10) return input;

  const areaLength = digits.startsWith("11")
    ? 2
    : THREE_DIGIT_AREA_CODES.has(digits.slice(0, 3))
      ? 3
      : 4;

  const area = digits.slice(0, areaLength);
  const rest = digits.slice(areaLength);

  // The last four digits always sit after the dash: 223 632-7551,
  // 11 4123-4567, 2966 12-3456.
  return `${area} ${rest.slice(0, -4)}-${rest.slice(-4)}`;
}

/**
 * Every stored form a given number might already have.
 *
 * Guest clients are keyed by `(businessId, phone)` on whatever string the person
 * typed, so the same customer could exist twice — once as "0223 632 7551" and
 * once as "+54 9 223 632-7551" — with their history split between the two, and
 * the code-based login unable to find either. New rows are written normalised;
 * this is what keeps the old ones reachable.
 */
export function phoneLookupVariants(input: string): string[] {
  const variants = new Set<string>([input.trim(), normalisePhone(input)]);
  const digits = nationalDigits(input);
  if (digits.length === 10) {
    variants.add(digits);
    variants.add(`0${digits}`);
    variants.add(`${COUNTRY_CODE}${digits}`);
    variants.add(`+${COUNTRY_CODE}${digits}`);
    variants.add(`${COUNTRY_CODE}9${digits}`);
  }
  return [...variants].filter(Boolean);
}
