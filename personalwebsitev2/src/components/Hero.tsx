import { lazy, Suspense, useRef } from "react";
import { motion, type Variants } from "motion/react";
import { useAtomValue, useSetAtom } from "jotai";
import { ArrowDown, ArrowUpRight, Mail } from "lucide-react";
import { heroPhaseAtom, isRevealed, domTVisibleAtom, lampHoverAtom } from "@/three/hero/heroPhase";
import profileFallback from "@/assets/profile-placeholder.jpg";

const HeroScene = lazy(() => import("@/three/hero/HeroScene"));

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export default function Hero() {
  const phase = useAtomValue(heroPhaseAtom);
  const revealed = isRevealed(phase);
  const domTVisible = useAtomValue(domTVisibleAtom);
  const setLampHover = useSetAtom(lampHoverAtom);

  const sectionRef = useRef<HTMLElement>(null);
  const tRef = useRef<HTMLSpanElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <motion.section
      ref={sectionRef}
      id="hero"
      className="relative isolate min-h-svh overflow-hidden"
      aria-label="Introduction"
      initial={{ backgroundColor: "rgba(0,0,0,1)" }}
      animate={{ backgroundColor: revealed ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)" }}
      transition={{ duration: 1.1, ease: "easeInOut" }}
    >
      {/* 3D stage */}
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <HeroScene
          className="absolute inset-0 z-0"
          tRef={tRef}
          avatarRef={avatarRef}
          sectionRef={sectionRef}
          fallback={
            <div className="absolute inset-0 flex items-end justify-center lg:justify-end lg:pr-[12vw]">
              <img
                src={profileFallback}
                alt=""
                className="mb-[8vh] h-[42svh] w-auto rounded-3xl object-cover opacity-90 shadow-glass"
              />
            </div>
          }
        />
      </Suspense>

      {/* copy */}
      <div className="pointer-events-none relative z-10 mx-auto grid min-h-svh w-full max-w-6xl grid-cols-1 items-center gap-6 px-6 pb-24 pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-16">
        <motion.div variants={container} initial="hidden" animate={revealed ? "show" : "hidden"} className="select-none">
          <motion.p variants={item} className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            Software engineer · Sydney
          </motion.p>

          <h1 className="font-raleway font-extrabold leading-none text-slate">
            <motion.span variants={item} className="display-lg block font-semibold text-primary">
              Hi!
            </motion.span>
            <motion.span variants={item} className="display-xl mt-2 block whitespace-nowrap">
              I&rsquo;m&nbsp;EDBER
              {/* the lamp lands on this T and morphs into it; hover to wake it up */}
              <motion.span
                ref={tRef}
                className="pointer-events-auto inline-block cursor-pointer"
                animate={{ opacity: domTVisible ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                onPointerEnter={() => setLampHover(true)}
                onPointerLeave={() => setLampHover(false)}
              >
                T
              </motion.span>
            </motion.span>
          </h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/80 md:text-xl">
            Fourth-year software engineer at the{" "}
            <span className="font-semibold text-sage">University of Sydney</span>. I build web experiences,
            games and the occasional embedded system.
          </motion.p>

          <motion.div variants={item} className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => scrollTo("experience")}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-hover"
            >
              See my work
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <a
              href="mailto:edbertswd@gmail.com"
              className="inline-flex items-center gap-2 rounded-full glass px-5 py-3 text-sm font-semibold text-slate transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover"
            >
              <Mail className="h-4 w-4 text-sage" />
              Get in touch
            </a>
          </motion.div>
        </motion.div>

        {/* the avatar stands on the bottom edge of this box */}
        <div ref={avatarRef} className="h-[44svh] w-full lg:h-[68svh]" aria-hidden />
      </div>

      {/* seam into the journey sky below */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-28 bg-linear-to-b from-transparent to-[#addcea]"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 1.2 }}
        aria-hidden
      />

      {/* scroll cue */}
      <motion.button
        onClick={() => scrollTo("about")}
        className={`absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full glass p-2.5 text-slate/70 hover:text-slate ${revealed ? "pointer-events-auto" : "pointer-events-none"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        aria-label="Scroll to my journey"
      >
        <ArrowDown className="h-4 w-4 animate-scroll-cue" />
      </motion.button>
    </motion.section>
  );
}
