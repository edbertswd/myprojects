// components/Hero.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Lamp, { type Pointer } from "./pets/Lamp";
import { motion, useReducedMotion } from "framer-motion";

/* Track the mouse pointer globally */
function usePointer(): Pointer {
  const [p, setP] = useState<Pointer>({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => setP({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return p;
}

export default function Hero() {
  const reduce = useReducedMotion();
  const pointer = usePointer();

  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const tSlotRef = useRef<HTMLSpanElement | null>(null);

  // Visual anchoring to the heading slot (for lamp placement only)
  const [landing, setLanding] = useState<{ x: number; y: number } | null>(null); // in heading coords
  const [slotH, setSlotH] = useState<number | null>(null);

  // Measure heading slot for visual placement
  useEffect(() => {
    const measure = () => {
      const slot = tSlotRef.current;
      const container = headingRef.current;
      if (!slot || !container) return;

      const sr = slot.getBoundingClientRect();
      const cr = container.getBoundingClientRect();

      // Bottom of lamp head should sit on the text baseline
      const landingLocal = { x: sr.left - cr.left + sr.width / 2, y: sr.bottom - cr.top };
      setLanding(landingLocal);
      setSlotH(sr.height);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);

  const headlineColor = "hsl(140 25% 40%)";

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative isolate min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Base cooler grey background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-slate-200" />

      {/* Subtle vignette to give contrast */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: "inset 0 0 160px 40px rgba(0,0,0,0.20)" }}
      />

      {/* Content (relative container anchors the lamp visually) */}
      <div ref={headingRef} className="relative z-10 max-w-4xl w-full px-6 text-center select-none">
        <span className="sr-only">Edbert — Full-stack Developer</span>

        <h1
          className="font-semibold tracking-tight leading-[0.95] text-5xl md:text-7xl"
          style={{ color: headlineColor }}
        >
          <span className="inline-flex items-baseline gap-2">
            <span>Hi! </span>
            {/* Invisible slot for 't' — measured for position & height */}
            <span
              ref={tSlotRef}
              aria-hidden
              className="inline-block align-baseline"
              style={{ width: "0.75em", height: "1em" }}
            />
          </span>
        </h1>

        <h1
          className="font-raleway font-extrabold tracking-tight leading-[0.95] text-5xl md:text-7xl"
          style={{ color: "var(--portfolio-orange)" }} 
        >
          <span className="inline-flex items-baseline gap-2 text-6xl md:text-8xl">
            <span>I’m&nbsp;Edber</span>
            <span
              ref={tSlotRef}
              aria-hidden
              className="inline-block align-baseline"
              style={{ width: "0.75em", height: "1em" }}
            />
          </span>
        </h1>

        <motion.p
          className="mt-5 text-lg md:text-xl font-robocond font-light text-slate-700"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <span className="text-foreground">I&apos;m a</span>{" "}
          <span className="text-sage font-roboto font-semibold">
            third year software engineer
          </span>{" "}
          <span className="text-foreground">at the</span>{" "}
          <span className="font-semibold text-sage">
            University of Sydney
          </span>.
        </motion.p>

        <motion.p
          className="mt-2 text-slate-700"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          
        </motion.p>

        {/* Lamp wrapper — bottom of lamp head aligns to text baseline (T shape) */}
        {landing && slotH && (
          <div
            className="pointer-events-none absolute z-50"
            style={{
              left: `${landing.x}px`,
              top: `${landing.y}px`,
              transform: "translate(-60%, -57%)", // bottom of head on baseline
            }}
          >
            <Lamp
              pointer={pointer}
              heightPx={slotH * 1.05}
            />
          </div>
        )}
      </div>
    </section>
  );
}
