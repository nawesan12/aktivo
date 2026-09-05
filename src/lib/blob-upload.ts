/**
 * Putting a file into Blob storage from the browser, in one attempt.
 *
 * This is what `upload()` from `@vercel/blob/client` does, minus its retry
 * loop. That loop is the reason this module exists: the SDK retries a failed
 * PUT ten times with exponential backoff — about seventeen minutes — and
 * reports nothing while it does. What the person saw was an uploader stuck on
 * "Subiendo…" forever, with no message, no cause, and no way to try again
 * without reloading the page. A single attempt that fails in seconds and says
 * why is worth more here than nine retries nobody waits for.
 *
 * The trade is that the wire format is ours to keep up with now. It is the
 * store's, not a public contract:
 *
 *   PUT https://vercel.com/api/blob/?pathname=<url-encoded pathname>
 *   authorization: Bearer <client token>
 *   x-api-version: 12
 *   x-vercel-blob-store-id: <store>
 *   x-vercel-blob-access: public
 *   x-content-type: <type>
 *
 * The pathname travels as a query parameter, not as a path segment — putting it
 * in the path reaches a route that does not exist and answers 404 to everything,
 * which is a confusing way to fail. `x-api-version` is the other thing to watch:
 * if Vercel moves it, uploads start failing with a clear message from the store,
 * and this constant is what has to follow.
 *
 * Everything about *who may write where* stays on the server, in
 * `/api/panel/uploads`: the token is issued there and carries the path, the
 * size ceiling and the allowed types, so nothing here can widen them.
 */

/** The store's API version this client speaks. See the note above. */
const BLOB_API_VERSION = "12";

const BLOB_API_URL = "https://vercel.com/api/blob";

/** What the route hands back, and the shape the store answers a PUT with. */
interface ClientTokenResponse {
  clientToken?: string;
}

interface BlobPutResponse {
  url: string;
  pathname: string;
  contentType?: string;
}

export interface UploadedBlob {
  url: string;
  pathname: string;
}

/**
 * The store id lives in the fourth underscore-separated segment of the token
 * (`vercel_blob_client_<store>_<payload>`), and the store wants it as its own
 * header — the token alone is not enough to resolve which store to write to.
 */
function storeIdFromToken(clientToken: string): string {
  const [, , , storeId = ""] = clientToken.split("_");
  return storeId;
}

/**
 * Names the step a network failure happened in.
 *
 * A `fetch` that never reaches the other side throws with only the browser's
 * own wording — "Load failed" in Safari, "Failed to fetch" in Chrome — and no
 * status and no body. Which of the two requests died is the whole diagnosis, and
 * without this the two are indistinguishable in the toast and in the log.
 */
async function withStep<T>(step: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`No se pudo ${step}: la conexión falló (${detail})`);
  }
}

/** Whatever the store said went wrong, in words the owner can act on. */
async function describeFailure(response: Response): Promise<string> {
  let detail = "";
  try {
    const body = (await response.json()) as { error?: { message?: string; code?: string } };
    detail = body?.error?.message ?? body?.error?.code ?? "";
  } catch {
    // A response that is not JSON tells us nothing beyond its status.
  }

  return detail
    ? `No pudimos guardar la imagen (${response.status}): ${detail}`
    : `No pudimos guardar la imagen (${response.status})`;
}

/**
 * Asks our own route for a short-lived token, then writes the file with it.
 *
 * `handleUploadUrl` is our route, so the first half is same-origin and carries
 * the session cookie; the second half goes straight to the store and never
 * touches a function.
 */
export async function uploadToBlob({
  pathname,
  file,
  kind,
  handleUploadUrl,
  signal,
}: {
  pathname: string;
  file: File;
  /** Travels as `clientPayload`; the route uses it to decide what is allowed. */
  kind: string;
  handleUploadUrl: string;
  signal?: AbortSignal;
}): Promise<UploadedBlob> {
  const tokenResponse = await withStep("pedir permiso", () =>
    fetch(handleUploadUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal,
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: { pathname, clientPayload: kind, multipart: false },
      }),
    })
  );

  if (!tokenResponse.ok) {
    // The route refuses with a plain message — plan, permission, or a path that
    // is not this business's — and that message is the useful part.
    let message = "";
    try {
      const body = (await tokenResponse.json()) as { error?: string };
      message = typeof body?.error === "string" ? body.error : "";
    } catch {
      // Fall through to the status.
    }
    throw new Error(message || `No pudimos pedir permiso para subir (${tokenResponse.status})`);
  }

  const { clientToken } = (await tokenResponse.json()) as ClientTokenResponse;
  if (!clientToken) throw new Error("El permiso para subir volvió vacío");

  const url = `${BLOB_API_URL}/?pathname=${encodeURIComponent(pathname)}`;
  const response = await withStep("guardar la imagen", () =>
    fetch(url, {
      method: "PUT",
      signal,
      headers: {
        authorization: `Bearer ${clientToken}`,
        "x-api-version": BLOB_API_VERSION,
        "x-vercel-blob-store-id": storeIdFromToken(clientToken),
        "x-vercel-blob-access": "public",
        "x-content-type": file.type,
      },
      body: file,
    })
  );

  if (!response.ok) throw new Error(await describeFailure(response));

  const blob = (await response.json()) as BlobPutResponse;
  if (!blob?.url) throw new Error("El almacenamiento no devolvió una dirección");

  return { url: blob.url, pathname: blob.pathname };
}
