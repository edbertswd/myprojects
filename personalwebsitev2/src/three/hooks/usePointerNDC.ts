import { useEffect, useRef } from "react";

export type PointerNDC = { x: number; y: number; active: boolean };

/**
 * Tracks the mouse as normalised device coordinates (-1..1, y up) in a ref,
 * so 3D code can read it every frame without triggering React renders.
 * Touch input keeps the pointer centred (`active: false`).
 */
export function usePointerNDC() {
  const ref = useRef<PointerNDC>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ref.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ref.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      ref.current.active = true;
    };
    const onLeave = () => {
      ref.current.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return ref;
}
