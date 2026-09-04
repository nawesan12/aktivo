"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api-message";

/** A failed request that still knows what the server answered. */
export class FetchError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "FetchError";
  }
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    // The API answers in Spanish and says useful things — that the plan does
    // not include this, that the trial ran out. The fetcher used to throw a
    // flat "Error al cargar datos" over all of it.
    throw new FetchError(await errorMessage(response, "No pudimos cargar los datos"), response.status);
  }
  return response.json();
};

/**
 * Nothing in the panel reads SWR's `error`, so a failed GET renders exactly
 * like an empty result: a table with no rows and no explanation. With retries
 * off, a single network blip left that empty table there until the person
 * reloaded the page, believing they had no clients.
 *
 * Two changes, both here rather than in fifty components: transient failures
 * are retried, and anything that survives the retries says so out loud.
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        dedupingInterval: 5000,
        revalidateOnFocus: false,
        errorRetryCount: 3,
        errorRetryInterval: 1500,
        onErrorRetry(error, _key, config, revalidate, { retryCount }) {
          // A 4xx is an answer, not a hiccup: retrying a 403 gets another 403.
          if (error instanceof FetchError && error.status < 500) return;
          if (retryCount >= (config.errorRetryCount ?? 3)) return;
          setTimeout(() => revalidate({ retryCount }), config.errorRetryInterval);
        },
        onError(error) {
          // Only failures the person can't see any other way. A 401 means the
          // session expired and the auth layer is already redirecting; a
          // 402/403/404 is a real answer that the screen itself renders — the
          // plan gate, the empty page — and toasting it would fire on every
          // visit to a section the plan doesn't include.
          if (error instanceof FetchError && error.status < 500) return;
          // One toast no matter how many hooks failed at once — a dashboard
          // mounts a dozen, and a dropped connection would fire a dozen.
          toast.error(error instanceof Error ? error.message : "No pudimos cargar los datos", {
            id: "swr-error",
          });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
