import { useEffect, useState, type RefObject } from "react";

/** Whether an element is (at least slightly) inside the viewport. */
export function useSceneVisibility(ref: RefObject<Element | null>, threshold = 0.05) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold, rootMargin: "120px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);

  return visible;
}
