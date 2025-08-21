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
  const bannerColor = "#a0dae8"

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative isolate min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
          className="absolute inset-0"
          style={{ backgroundColor: bannerColor }}
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


      {/* Bottom cloud transition */}
    <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        style={{ opacity: 0.7 }}
      >
        <defs>
          <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
        </defs>
        
        {/* Large background cloud */}
        <ellipse cx="200" cy="140" rx="120" ry="35" fill="url(#cloudGradient)" />
        <ellipse cx="170" cy="125" rx="80" ry="25" fill="url(#cloudGradient)" />
        <ellipse cx="230" cy="130" rx="90" ry="30" fill="url(#cloudGradient)" />
        
        {/* Medium cloud cluster */}
        <ellipse cx="500" cy="135" rx="100" ry="30" fill="rgba(255,255,255,0.6)" />
        <ellipse cx="480" cy="120" rx="70" ry="20" fill="rgba(255,255,255,0.6)" />
        <ellipse cx="520" cy="125" rx="80" ry="25" fill="rgba(255,255,255,0.6)" />
        
        {/* Large cloud on right */}
        <ellipse cx="850" cy="145" rx="130" ry="40" fill="url(#cloudGradient)" />
        <ellipse cx="820" cy="130" rx="90" ry="28" fill="url(#cloudGradient)" />
        <ellipse cx="880" cy="135" rx="100" ry="32" fill="url(#cloudGradient)" />
        
        {/* Small scattered clouds */}
        <ellipse cx="100" cy="160" rx="60" ry="18" fill="rgba(255,255,255,0.4)" />
        <ellipse cx="350" cy="155" rx="70" ry="20" fill="rgba(255,255,255,0.5)" />
        <ellipse cx="650" cy="150" rx="80" ry="22" fill="rgba(255,255,255,0.5)" />
        <ellipse cx="1000" cy="160" rx="65" ry="19" fill="rgba(255,255,255,0.4)" />
        
        {/* Very small wispy clouds */}
        <ellipse cx="75" cy="175" rx="40" ry="12" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="300" cy="170" rx="45" ry="14" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="750" cy="175" rx="50" ry="15" fill="rgba(255,255,255,0.3)" />
        <ellipse cx="1100" cy="170" rx="42" ry="13" fill="rgba(255,255,255,0.3)" />
      </svg>
      </div>
  </section>
  );
}
