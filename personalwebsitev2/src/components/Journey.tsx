import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { animate } from "motion";
import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { checkpoints, type Checkpoint } from "@/data/journey";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useScrollHijack } from "@/hooks/useScrollHijack";
import { clamp } from "@/three/lib/tween";
import GlassCard from "@/components/ui/GlassCard";
import city from "@/assets/city/7.png";

const JourneyScene = lazy(() => import("@/three/journey/JourneyScene"));

const WHEEL_SENSITIVITY = 0.00016;
const SWIPE_SENSITIVITY = 0.0016;

export default function Journey() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const sectionRef = useRef<HTMLElement>(null);

  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Checkpoint | null>(null);

  const setP = useCallback((v: number) => {
    const c = clamp(v, 0, 1);
    progressRef.current = c;
    setProgress(c);
    return c;
  }, []);

  const activeIndex = useMemo(() => {
    let best = 0;
    let bestD = Infinity;
    checkpoints.forEach((cp, i) => {
      const d = Math.abs(progress - cp.t);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }, [progress]);

  // Desktop: wheel drives the road
  useScrollHijack(sectionRef, {
    enabled: !isMobile,
    getProgress: () => progressRef.current,
    onDelta: (delta) => setP(progressRef.current + delta * WHEEL_SENSITIVITY),
  });

  // Mobile: horizontal drag drives the road
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !isMobile) return;
    let lastX: number | null = null;
    const start = (e: TouchEvent) => {
      lastX = e.touches[0].clientX;
    };
    const move = (e: TouchEvent) => {
      if (lastX === null) return;
      const x = e.touches[0].clientX;
      const dx = lastX - x;
      lastX = x;
      setP(progressRef.current + dx * SWIPE_SENSITIVITY);
    };
    const end = () => {
      lastX = null;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: true });
    el.addEventListener("touchend", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
    };
  }, [isMobile, setP]);

  // Keyboard
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(activeIndex + 1);
      if (e.key === "ArrowLeft") goTo(activeIndex - 1);
      if (e.key === "Escape") setSelected(null);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const goTo = useCallback(
    (index: number) => {
      const cp = checkpoints[clamp(index, 0, checkpoints.length - 1)];
      animate(progressRef.current, cp.t, {
        duration: 0.9,
        ease: [0.4, 0, 0.2, 1],
        onUpdate: (v) => setP(v),
      });
    },
    [setP]
  );

  const onSignClick = useCallback(
    (cp: Checkpoint, index: number) => {
      goTo(index);
      setSelected(cp);
    },
    [goTo]
  );

  const current = checkpoints[activeIndex];

  return (
    <section
      ref={sectionRef}
      id="about"
      tabIndex={-1}
      className="relative isolate h-svh min-h-[640px] overflow-hidden outline-none"
      aria-labelledby="journey-heading"
      style={{ touchAction: isMobile ? "pan-y" : "auto" }}
    >
      <Suspense fallback={<div className="absolute inset-0 bg-section" />}>
        <JourneyScene
          className="absolute inset-0 z-0"
          progressRef={progressRef}
          checkpoints={checkpoints}
          activeIndex={activeIndex}
          onSignClick={onSignClick}
          mobile={isMobile}
          fallback={
            <div className="absolute inset-0 bg-cover bg-bottom opacity-40" style={{ backgroundImage: `url(${city})` }} />
          }
        />
      </Suspense>

      {/* Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-24 text-center md:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-dark">
          <MapPin className="h-3.5 w-3.5 text-sage" /> My journey
        </span>
        <h2 id="journey-heading" className="display-lg mt-4 font-extrabold text-slate">
          The road so far
        </h2>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {isMobile ? "Swipe to drive · tap a sign to read" : "Scroll to drive · click a sign to read · keep scrolling to leave"}
        </p>
      </div>

      {/* HUD */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-6 md:pb-8">
        <GlassCard className="pointer-events-auto flex w-full max-w-2xl items-center gap-3 px-3 py-3 md:gap-4 md:px-5">
          <button
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="rounded-full p-2 text-slate transition hover:bg-sage/15 disabled:opacity-30"
            aria-label="Previous milestone"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="truncate font-raleway text-sm font-bold text-slate md:text-base">
                {activeIndex + 1}. {current.title}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">{Math.round(progress * 100)}%</span>
            </div>
            <div className="relative h-2 rounded-full bg-slate/10">
              <div className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-primary to-sage" style={{ width: `${progress * 100}%` }} />
              {checkpoints.map((cp, i) => (
                <button
                  key={cp.id}
                  onClick={() => goTo(i)}
                  aria-label={cp.title}
                  className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-transform hover:scale-125 ${
                    progress >= cp.t - 0.01 ? "bg-primary" : "bg-taupe/70"
                  }`}
                  style={{ left: `${cp.t * 100}%` }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === checkpoints.length - 1}
            className="rounded-full p-2 text-slate transition hover:bg-sage/15 disabled:opacity-30"
            aria-label="Next milestone"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </GlassCard>
      </div>

      {/* Detail overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate/35 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GlassCard strong className="relative p-7 md:p-9">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-sage/15 hover:text-slate"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-sage">
                  Milestone {checkpoints.indexOf(selected) + 1}
                </span>
                <h3 className="mt-2 font-raleway text-2xl font-extrabold text-slate md:text-3xl">{selected.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-foreground/80">{selected.text}</p>
                <button
                  onClick={() => setSelected(null)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-dark"
                >
                  Keep driving <ChevronRight className="h-4 w-4" />
                </button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessible list of milestones */}
      <ol className="sr-only">
        {checkpoints.map((cp) => (
          <li key={cp.id} id={cp.id}>
            <h3>{cp.title}</h3>
            <p>{cp.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
