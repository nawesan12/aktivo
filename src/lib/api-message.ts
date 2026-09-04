/**
 * The message the server actually sent, or a fallback.
 *
 * The panel used to throw `new Error()` on any failed response and catch it
 * with a generic "Error al guardar". Meanwhile the API answers in plain
 * Spanish, and says useful things: that the feature belongs to another plan,
 * that the trial ran out, that a phone number is not valid. All of it was
 * thrown away, so every failure looked like the same shrug.
 */
export async function errorMessage(
  response: Response,
  fallback = "No pudimos completar la acción"
): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" && body.error ? body.error : fallback;
  } catch {
    return fallback;
  }
}

/** What to show the user for a thrown value of unknown shape. */
export function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
