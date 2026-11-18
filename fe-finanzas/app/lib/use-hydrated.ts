"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Returns false during the server prerender and true after hydration.
 * This keeps browser-only values such as the current date out of prerendered HTML.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
