"use client";

import { useEffect, useState } from "react";

/**
 * A value that settles before anything acts on it.
 *
 * The client and appointment searches built their SWR key straight from the
 * input's state, so typing "Rodríguez" fired nine requests — and on clients,
 * nine unbounded queries across two tables — to show the result of the ninth.
 */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
