import { NextResponse } from "next/server";

/**
 * Serves a public response from Vercel's CDN instead of re-invoking the
 * function for every caller.
 *
 * The endpoints this wraps — the directory, a business's services and staff —
 * answer the same thing to everyone and change when an owner edits something,
 * which is rarely. Left uncached, every visitor walking the booking flow cost
 * three or four invocations and a handful of queries for data that had not
 * moved in days.
 *
 * `s-maxage` is what the shared cache honours; `max-age=0` keeps browsers
 * asking, so a stale tab never shows an old price. `stale-while-revalidate`
 * means the first request after expiry is still served instantly while the
 * refresh happens behind it.
 *
 * The window is the cost of an edit not showing up immediately, so keep it
 * short. The public *page* of a business is purged on the spot when its owner
 * changes something (see `revalidateBusinessPage`); this cache is not, and
 * cannot be.
 */
export function cachedJson<T>(
  data: T,
  { seconds = 60, swr = seconds * 10 }: { seconds?: number; swr?: number } = {}
): NextResponse {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${swr}`,
    },
  });
}
