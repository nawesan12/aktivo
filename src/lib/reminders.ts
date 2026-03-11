/**
 * Fire-and-forget reminder trigger.
 * Can be called from any client component as a side-effect.
 */
export function triggerReminders(): void {
  const secret = process.env.NEXT_PUBLIC_REMINDERS_SECRET;
  if (!secret) return;

  fetch(`/api/reminders/process?secret=${encodeURIComponent(secret)}`, {
    method: "GET",
  }).catch(() => {
    // Fire-and-forget — silently ignore errors
  });
}
