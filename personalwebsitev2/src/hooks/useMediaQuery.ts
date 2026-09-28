import { useCallback, useSyncExternalStore } from "react";

/** Reactive `window.matchMedia` without a render-then-effect flash. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => typeof window !== "undefined" && !!window.matchMedia?.(query).matches,
    [query]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
