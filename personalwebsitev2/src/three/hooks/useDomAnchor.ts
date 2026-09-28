import { useEffect, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { measureAnchor, type WorldAnchor } from "../lib/domToWorld";

/**
 * Inside a Canvas: continuously maps a DOM element's rect to world space on
 * a fixed z plane. Returns a ref (no re-renders) — read it in useFrame.
 */
export function useDomAnchor(elRef: RefObject<Element | null>, zPlane = 0, glyphText?: string, live = false) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const anchor = useRef<WorldAnchor>({
    bottomCenter: new Vector3(),
    center: new Vector3(),
    glyphBase: new Vector3(),
    glyphCap: 0,
    glyphWidth: 0,
    height: 0,
    width: 0,
    ready: false,
  });

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const measureNow = () => {
      camera.updateMatrixWorld();
      measureAnchor(el, gl.domElement, camera, zPlane, anchor.current, glyphText);
    };

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measureNow);
    };

    measure();
    // Fonts change glyph metrics after first paint
    document.fonts?.ready.then(measure).catch(() => {});
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(gl.domElement);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });

    // While `live`, sample every frame — covers transform-only moves (e.g. a
    // framer-motion entrance animation on an ancestor) that don't trigger
    // ResizeObserver, resize, or scroll.
    let liveRaf = 0;
    if (live) {
      const tick = () => {
        measureNow();
        liveRaf = requestAnimationFrame(tick);
      };
      liveRaf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(liveRaf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
    // size in deps forces a re-measure when the canvas resizes
  }, [elRef, camera, gl, zPlane, glyphText, size.width, size.height, live]);

  return anchor;
}
