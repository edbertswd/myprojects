import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return typeof window !== "undefined" && !!window.matchMedia?.(QUERY).matches;
}

/** True when the OS asks for reduced motion. Shared by DOM and 3D code. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
