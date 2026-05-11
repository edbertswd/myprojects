// components/Hero.tsx
import React, { useEffect, useRef, useState } from "react";
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

// Choreography timing
const TIME_LAMP_LIT_TO_ILLUMINATED = 1200;  // after lamp lights up, scene fades in
const TIME_ILLUMINATED_TO_JUMP = 1500;     // after scene revealed, lamp jumps to T

// How far to the right of T the lamp lands (in px, relative to lamp wrapper)
const LAMP_LANDING_OFFSET_X = 100;

// Final x offset after the lamp lands as the T (0 = centered on T, negative = left, positive = right)
const LAMP_FINAL_OFFSET_X = 25;

type IntroPhase =
  | 'dark'
  | 'lampLit'
  | 'illuminated'
  | 'jumpingToT'
  | 'settled';

export default function Hero() {
  const reduce = useReducedMotion();
  const pointer = usePointer();

  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const tLetterRef = useRef<HTMLSpanElement | null>(null);

  const [introPhase, setIntroPhase] = useState<IntroPhase>(reduce ? 'settled' : 'dark');

  const [landing, setLanding] = useState<{ x: number; y: number } | null>(null);
  const [slotH, setSlotH] = useState<number | null>(null);

  // Measure the "T" letter position for lamp placement
  useEffect(() => {
    const measure = () => {
      const tEl = tLetterRef.current;
      const container = headingRef.current;
      if (!tEl || !container) return;

      const tr = tEl.getBoundingClientRect();
      const cr = container.getBoundingClientRect();

      setLanding({ x: tr.left - cr.left + tr.width / 2, y: tr.bottom - cr.top });
      setSlotH(tr.height);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);

  // Lamp lands beside T → light flickers on → scene fades in → lamp jumps to T
  const handleLampLanded = () => {
    setIntroPhase('lampLit');
    setTimeout(() => {
      setIntroPhase('illuminated');
      setTimeout(() => setIntroPhase('jumpingToT'), TIME_ILLUMINATED_TO_JUMP);
    }, TIME_LAMP_LIT_TO_ILLUMINATED);
  };

  // Lamp finished backflip + looking pose — lamp stays as the T
  const handleLampSettled = () => {
    setIntroPhase('settled');
  };

  const isIlluminated =
    introPhase === 'illuminated' ||
    introPhase === 'jumpingToT' ||
    introPhase === 'settled';

  const lightOn = introPhase !== 'dark';

  const shouldTriggerFlip =
    introPhase === 'jumpingToT' ||
    introPhase === 'settled';

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative isolate min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Hero background */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: "hsl(var(--hero-banner))" }}
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: isIlluminated ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Dark overlay for Pixar intro — stays fully opaque while lamp lights itself */}
      {!reduce && (
        <motion.div
          className="absolute inset-0 bg-black z-30"
          initial={{ opacity: 1 }}
          animate={{ opacity: isIlluminated ? 0 : 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ pointerEvents: isIlluminated ? "none" : "auto" }}
        />
      )}

      {/* Content */}
      <div ref={headingRef} className="relative z-10 max-w-4xl w-full px-6 text-center select-none">
        <span className="sr-only">Edbert — Full-stack Developer</span>

        <motion.h1
          className="font-semibold tracking-tight leading-[0.95] text-5xl md:text-7xl"
          style={{ color: "hsl(var(--primary))" }}
          initial={{ opacity: 0, y: 20 }}
          animate={isIlluminated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-baseline gap-2">
            <span>Hi! </span>
          </span>
        </motion.h1>

        <motion.h1
          className="font-raleway font-extrabold tracking-tight leading-[0.95] text-5xl md:text-7xl"
          style={{ color: "#2b303b" }}
          initial={{ opacity: 0, y: 20 }}
          animate={isIlluminated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <span className="inline-flex items-baseline text-6xl md:text-8xl">
            <span>I'm&nbsp;EDBER</span>
            {/* Invisible "T" — reserves layout space; the lamp is the actual T */}
            <span ref={tLetterRef} style={{ opacity: 0 }} aria-hidden>
              T
            </span>
          </span>
        </motion.h1>

        <motion.p
          className="mt-5 text-lg md:text-xl font-robocond font-light text-slate-700"
          initial={{ opacity: 0, y: 12 }}
          animate={isIlluminated ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        >
          <span className="text-foreground">I&apos;m a</span>{" "}
          <span className="text-sage font-roboto font-semibold">
            fourth year software engineer
          </span>{" "}
          <span className="text-foreground">at the</span>{" "}
          <span className="font-semibold text-sage">
            University of Sydney
          </span>.
        </motion.p>

        <motion.p
          className="mt-2 text-slate-700"
          initial={{ opacity: 0, y: 8 }}
          animate={isIlluminated ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
        >

        </motion.p>

      </div>

      {/* Lamp — lands beside T, then jumps into T position */}
      {landing && slotH && headingRef.current && (
        <div
          className="pointer-events-none absolute z-40"
          style={{
            left: `${headingRef.current.offsetLeft + landing.x}px`,
            top: `${headingRef.current.offsetTop + landing.y}px`,
            transform: "translate(-75%, -125%)",
          }}
        >
          <motion.div
            initial={{ x: reduce ? 0 : LAMP_LANDING_OFFSET_X }}
            animate={{
              x: shouldTriggerFlip ? LAMP_FINAL_OFFSET_X : LAMP_LANDING_OFFSET_X,
            }}
            transition={{
              x: { duration: 0.85, ease: [0.4, 0, 0.2, 1] },
            }}
          >
            <Lamp
              pointer={pointer}
              heightPx={slotH * 0.8}
              onLanded={handleLampLanded}
              onSettled={handleLampSettled}
              lightOn={lightOn}
              triggerFlip={shouldTriggerFlip}
            />
          </motion.div>
        </div>
      )}

      {/* Bottom cloud transition */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 md:h-40 pointer-events-none"
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: isIlluminated ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      >
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
      </motion.div>
    </section>
  );
}
