import { useEffect, type RefObject } from "react";

type Options = {
  /** Called with the wheel delta (px). Return the new 0..1 progress, or null to ignore. */
  onDelta: (delta: number) => number | null;
  /** Read the current progress so edge release can be decided. */
  getProgress: () => number;
  /** Wheel px past an edge before the page scrolls normally again. */
  releaseThreshold?: number;
  /** Engage only when at least this fraction of the viewport is covered by the section. */
  engageRatio?: number;
  enabled?: boolean;
};

/**
 * Captures wheel input while a section fills the viewport and turns it into
 * horizontal progress; releases the page scroll after the user pushes past
 * either edge. Ported from the original About.tsx behaviour, but the
 * visibility test runs synchronously inside the wheel handler so the very
 * first tick after scrolling into the section is never lost.
 */
export function useScrollHijack(
  ref: RefObject<HTMLElement | null>,
  { onDelta, getProgress, releaseThreshold = 700, engageRatio = 0.6, enabled = true }: Options
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let released = false;
    let overflow = 0;

    const coverage = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      return visible / Math.min(r.height, vh);
    };

    // Re-arm once the section has mostly left the viewport
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.3) {
          released = false;
          overflow = 0;
        }
      },
      { threshold: [0, 0.3] }
    );
    io.observe(el);

    const onWheel = (e: WheelEvent) => {
      if (released || coverage() < engageRatio) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const before = getProgress();
      const atStart = before <= 0 && delta < 0;
      const atEnd = before >= 1 && delta > 0;

      if (atStart || atEnd) {
        overflow += delta;
        if (Math.abs(overflow) > releaseThreshold) {
          released = true; // let the page scroll
          return;
        }
        e.preventDefault();
        return;
      }

      overflow = 0;
      e.preventDefault();
      onDelta(delta);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      io.disconnect();
    };
  }, [ref, onDelta, getProgress, releaseThreshold, engageRatio, enabled]);
}
