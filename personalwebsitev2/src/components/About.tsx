import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";

type Checkpoint = {
  t: number; // 0..1
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
  id?: string;
};

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
};

export default function AboutJourneyInfiniteRoad() {
  // --- DATA ---
  const checkpoints: Checkpoint[] = useMemo(
    () => [
      { t: 0.04, id: "chapter-beginnings", title: "Beginnings", text: "Born in 2002, the youngest — learned to be heard.", imageSrc: "/images/journey/beginnings.webp", imageAlt: "Childhood sunset silhouette" },
      { t: 0.16, id: "chapter-jakarta", title: "High School in Jakarta", text: "Tried everything — still searching for my thing.", imageSrc: "/images/journey/jakarta.webp", imageAlt: "Jakarta skyline and schoolyard" },
      { t: 0.36, id: "chapter-atlanta", title: "Atlanta & Covid Era (2019–2022)", text: "Moved to Atlanta; taught myself to code. First Hello World.", imageSrc: "/images/journey/atlanta-desk.webp", imageAlt: "Laptop by a window in Atlanta" },
      { t: 0.52, id: "chapter-sydney", title: "Sydney Chapter", text: "New culture, new resilience; grew as an engineer.", imageSrc: "/images/journey/sydney.webp", imageAlt: "Sydney skyline at dusk" },
      { t: 0.66, id: "chapter-content", title: "Content Creation", text: "Built a Twitch community of 1.8k — learned to connect.", imageSrc: "/images/journey/twitch.webp", imageAlt: "Streamer desk with soft lighting" },
      { t: 0.80, id: "chapter-gamedev", title: "Game Development", text: "Building little worlds; inspired by ConcernedApe.", imageSrc: "/images/journey/gamedev.webp", imageAlt: "Pixel art mockup and code editor" },
      { t: 0.92, id: "chapter-next", title: "What's Next?", text: "Still writing the story — excited for the leap 🚀", imageSrc: "/images/journey/whats-next.webp", imageAlt: "Open highway into sunrise" },
    ],
    []
  );

  // --- STATE ---
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);               // 0..1 (drives world)
  const [displayProgress, setDisplayProgress] = useState(0); // smoothed bar
  const [hoverPause, setHoverPause] = useState(false);       
  const [autoplayZone, setAutoplayZone] = useState(false);   // ≥30% visible
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const playing = autoplayZone && !hoverPause && !reducedMotion;

  const midpoints = useMemo(() => {
    const mids: number[] = [Number.NEGATIVE_INFINITY];
    for (let i = 0; i < checkpoints.length - 1; i++) {
      mids.push((checkpoints[i].t + checkpoints[i + 1].t) / 2);
    }
    mids.push(Number.POSITIVE_INFINITY);
    return mids;
  }, [checkpoints]);

  const activeIndex = useMemo(() => {
    for (let i = 0; i < checkpoints.length; i++) {
      if (progress >= midpoints[i] && progress < midpoints[i + 1]) return i;
    }
    return undefined;
  }, [progress, checkpoints, midpoints]);

  // --- Parallax world (subtle) ---
  const PAN_X_FAR = -600;   
  const PAN_X_NEAR = -1800; // near objects
  const world = useMemo(() => {
    const p = clamp(progress);
    if (reducedMotion) return { farX: 0, nearX: 0, zoom: 1 };
    return {
      farX: p * PAN_X_FAR,
      nearX: p * PAN_X_NEAR,
      zoom: 1 - p * 0.03,
    };
  }, [progress, reducedMotion]);

  // --- Visibility: start at ≥30%, stop at <15% ---
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const r = entry?.intersectionRatio ?? 0;
        if (r >= 0.3) setAutoplayZone(true);
        if (r < 0.15) setAutoplayZone(false);
      },
      { threshold: Array.from({ length: 101 }, (_, i) => i / 100) }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // --- Autoplay loop: 0→1, wrap to 0 while playing ---
  useEffect(() => {
    controlsRef.current?.cancel();
    controlsRef.current = null;
    if (!playing) return;

    const baseDuration = 36; // seconds full cycle

    const run = () => {
      const remaining = Math.max(0, 1 - progress);
      const duration = Math.max(0.2, baseDuration * remaining);
      const ctrl = animate(progress, 1, {
        duration,
        easing: (t) => t,
        onUpdate: (v) => setProgress(v),
        onComplete: () => {
          setProgress(0);
          if (playing) requestAnimationFrame(run);
        },
      });
      controlsRef.current = ctrl;
    };

    run();
    return () => controlsRef.current?.cancel();
  }, [playing]);

  // --- Smooth bar ---
  useEffect(() => {
    let raf = 0;
    const stiffness = 0.18;
    const loop = () => {
      setDisplayProgress((d) => {
        const target = progress;
        const next = d + (target - d) * stiffness;
        return Math.abs(next - target) < 0.001 ? target : next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  // --- Preload next image (wrap-aware) ---
  useEffect(() => {
    if (typeof activeIndex !== "number") return;
    const next = checkpoints[(activeIndex + 1) % checkpoints.length];
    const img = new Image();
    img.src = next.imageSrc;
  }, [activeIndex, checkpoints]);

  const cardVisible = typeof activeIndex === "number";

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative min-h-[680px] md:min-h-[720px] overflow-hidden"
      aria-labelledby="journey-heading"
    >
      <h2 id="journey-heading" className="sr-only">Journey</h2>

      {/* Local animations: road + skyline scroll (tile-perfect) */}
      <style>{`
        /* Road tiles (unchanged) */
        @keyframes road-scroll { from { background-position-x: 0; } to { background-position-x: -480px; } }

        /* Generic loop that moves exactly one full tile width */
        @keyframes tile-scroll { from { background-position-x: 0; } to { background-position-x: calc(var(--tile) * -1); } }

        .animate-road { animation: road-scroll 22s linear infinite; }

        /* Base for any repeating skyline/strip */
        .strip {
          animation: tile-scroll var(--duration,80s) linear infinite;
          animation-play-state: paused;           /* only plays when .is-playing is added */
          background-repeat: repeat-x;
          background-size: var(--tile) 100%;
          will-change: background-position;
          pointer-events: none;
        }
        .strip.is-playing { animation-play-state: running; }

        /* Optional subtle brightness twinkle (doesn't affect tiling math) */
        @keyframes twinkle { 0%,100%{opacity:.12} 50%{opacity:.22} }
        .twinkle::after{
          content:""; position:absolute; inset:0; pointer-events:none;
          background: radial-gradient(circle 1px at 10px 10px, rgba(255,255,255,.7) 99%, transparent) 0 0/20px 16px;
          opacity:.16; animation: twinkle 3.6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-road { animation-play-state: paused !important; }
          .strip       { animation-play-state: paused !important; }
        }
      `}</style>


    {/* FAR SKY + subtle tint  */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        transform: `scale(${world.zoom})`,   // ok to keep scale for depth
        transformOrigin: "center",
        background:
          "radial-gradient(1200px 600px at 50% -200px, hsl(var(--primary)/0.08), transparent), linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background))/0.7)",
      }}
      aria-hidden
    />

    {/* FAR SKYLINE — very sparse, tallest silhouettes, slowest */}
    <div
      className={[
        "strip absolute inset-x-0 top-[12%] h-[36%]",
        playing && !reducedMotion ? "is-playing" : "",
      ].join(" ")}
      style={{
        // Large tile to avoid obvious repetition
        ["--tile" as any]: "1600px",
        ["--duration" as any]: "130s",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8," +
          "<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='288' viewBox='0 0 1600 288'>" +
            // four spaced buildings + a couple antennas; low alpha so they sit back
            "<rect x='90'   y='60'  width='160' height='228' fill='rgba(16,18,26,0.20)'/>" +
            "<rect x='520'  y='86'  width='120' height='202' fill='rgba(16,18,26,0.22)'/>" +
            "<rect x='980'  y='48'  width='180' height='240' fill='rgba(16,18,26,0.20)'/>" +
            "<rect x='1380' y='104' width='110' height='184' fill='rgba(16,18,26,0.18)'/>" +
            "<rect x='160'  y='28'  width='3'   height='32'  fill='rgba(16,18,26,0.30)'/>" +
            "<rect x='1068' y='24'  width='3'   height='30'  fill='rgba(16,18,26,0.30)'/>" +
          "</svg>\")",
        maskImage: "linear-gradient(to top, transparent 0%, black 28%, black 92%, transparent 100%)",
      }}
      aria-hidden
    />

    {/* MID SKYLINE — slightly closer, a bit bolder, still sparse */}
    <div
      className={[
        "strip absolute inset-x-0 top-[28%] h-[32%]",
        playing && !reducedMotion ? "is-playing" : "",
      ].join(" ")}
      style={{
        // Different tile to de-sync the pattern from the far layer
        ["--tile" as any]: "1200px",
        ["--duration" as any]: "95s",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8," +
          "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='256' viewBox='0 0 1200 256'>" +
            // three buildings with varied tops (roof blocks)
            "<g fill='rgba(22,24,32,0.42)'>" +
              "<rect x='140' y='72'  width='150' height='184'/>" +
              "<rect x='520' y='88'  width='130' height='168'/>" +
              "<rect x='910' y='64'  width='170' height='192'/>" +
            "</g>" +
            "<g fill='rgba(255,255,255,0.06)'>" +
              "<rect x='140' y='64'  width='46' height='8'/>" +   // roof details
              "<rect x='520' y='80'  width='32' height='8'/>" +
              "<rect x='910' y='56'  width='54' height='8'/>" +
            "</g>" +
            // sparse “window rows” as subtle lines that won’t cause seams
            "<g fill='rgba(255,255,255,0.045)'>" +
              "<rect x='140' y='128' width='150' height='2'/>" +
              "<rect x='520' y='138' width='130' height='2'/>" +
              "<rect x='910' y='120' width='170' height='2'/>" +
              "<rect x='140' y='168' width='150' height='2'/>" +
              "<rect x='520' y='176' width='130' height='2'/>" +
              "<rect x='910' y='164' width='170' height='2'/>" +
            "</g>" +
          "</svg>\")",
        maskImage: "linear-gradient(to top, transparent 0%, black 22%, black 92%, transparent 100%)",
      }}
      aria-hidden
    />

      {/* BUSH STRIP */}
      <div
        className={[
          "strip absolute inset-x-0 bottom-44 h-16",
          playing && !reducedMotion ? "is-playing" : "",
        ].join(" ")}
        style={{
          ["--tile" as any]: "700px",
          ["--duration" as any]: "48s",        // mid speed
          backgroundImage:
            "url(\"data:image/svg+xml;utf8," +
            "<svg xmlns='http://www.w3.org/2000/svg' width='700' height='64' viewBox='0 0 700 64'>" +
              /* bushes kept well inside tile edges to avoid seam pop */
              "<ellipse cx='80'  cy='52' rx='44' ry='18' fill='rgba(16,32,18,0.35)'/>" +
              "<ellipse cx='180' cy='50' rx='34' ry='14' fill='rgba(16,32,18,0.32)'/>" +
              "<ellipse cx='300' cy='54' rx='42' ry='17' fill='rgba(16,32,18,0.34)'/>" +
              "<ellipse cx='460' cy='53' rx='36' ry='16' fill='rgba(16,32,18,0.33)'/>" +
              "<ellipse cx='590' cy='51' rx='38' ry='16' fill='rgba(16,32,18,0.33)'/>" +
            "</svg>\")",
          maskImage: "linear-gradient(to top, transparent 0%, black 40%, black 100%)",
        }}
        aria-hidden
      />
      {/* ROAD */}
      <div className="absolute left-0 right-0 bottom-8 md:bottom-12 h-28 md:h-32 pointer-events-none" aria-hidden>
        <div
          className={`${playing && !reducedMotion ? "animate-road" : ""} absolute inset-x-[-200px] -inset-y-2 rounded-[18px]`}
          style={{
            backgroundImage: "url('/images/textures/asphalt-tile.png')",
            backgroundRepeat: "repeat-x",
            backgroundSize: "480px 100%",
            filter: "contrast(0.98) brightness(0.95)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.28), inset 0 8px 28px rgba(0,0,0,0.35)",
          }}
        />
        <div
          className={`${playing && !reducedMotion ? "animate-road" : ""} absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2`}
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--foreground)) 0 24px, transparent 24px 54px)",
            opacity: 0.55,
            mixBlendMode: "screen",
            backgroundSize: "480px 100%",
          }}
        />
        <div
          className="absolute inset-0 rounded-[18px]"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0, black 40%, black 70%, transparent 100%)",
            background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.25))",
          }}
        />
      </div>
      
    

      {/* CAR */}
      <div className="absolute left-1/2 bottom-[88px] md:bottom-[112px] -translate-x-1/2 select-none" aria-hidden>
        {/* Exhaust */}
        {!reducedMotion && (
          <div className="absolute right-full bottom-1/2 translate-y-1/2 pointer-events-none">
            <span className="absolute w-1.5 h-1.5 bg-gray-300 rounded-full blur-sm animate-exhaust" />
            <span className="absolute w-1.5 h-1.5 bg-gray-300 rounded-full blur-sm animate-exhaust [animation-delay:.45s]" />
            <span className="absolute w-1.5 h-1.5 bg-gray-300 rounded-full blur-sm animate-exhaust [animation-delay:.9s]" />
          </div>
        )}

        {/* Headlight cone */}
        <div
          className="absolute left-[58px] top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 120, height: 60,
            background: "linear-gradient(0.25turn, rgba(255,255,220,.35), rgba(255,255,220,.08) 55%, transparent 70%)",
            clipPath: "polygon(0% 45%, 100% 20%, 100% 80%, 0% 55%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
            opacity: reducedMotion ? 0.5 : 1
          }}
        />

        {/* Car SVG */}
        <svg width="120" height="56" viewBox="0 0 120 56" className={`drop-shadow-xl opacity-95 ${reducedMotion ? "" : "animate-car-bob"}`}>
          <defs>
            <linearGradient id="paint" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary)/0.75)" />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(220,235,255,.9)" />
              <stop offset="100%" stopColor="rgba(120,150,190,.7)" />
            </linearGradient>
          </defs>

          <ellipse cx="60" cy="50" rx="42" ry="4" fill="black" opacity="0.2" />
          <path d="M18 34 C22 25, 30 18, 46 16 L74 16 C86 16, 95 23, 100 30 L108 34 C110 35, 110 38, 106 38 L16 38 C12 38, 12 36, 14 34 Z" fill="url(#paint)" stroke="hsl(var(--primary)/0.65)" strokeWidth="1.2" />
          <path d="M48 16 L70 16 C78 16, 84 20, 87 26 L53 26 C49 26, 46 24, 46 22 Z" fill="url(#glass)" opacity="0.95" />
          <path d="M48 16 L53 26" stroke="rgba(255,255,255,.45)" strokeWidth="1.4" />
          <rect x="20" y="33.2" width="84" height="2.2" fill="rgba(255,255,255,.18)" />
          <path d="M22 29 L16 29 L14 27 L22 27 Z" fill="hsl(var(--primary)/0.85)" />
          <rect x="98" y="30" width="8" height="5" rx="2" fill="#fff6cc" />
          <rect x="98" y="30" width="8" height="5" rx="2" fill="#fff6cc" opacity=".35" />

          {/* Left wheel */}
          <g transform="translate(38,40)">
            <circle r="10" fill="black" />
            <circle r="6.5" fill="#cfcfd2" />
            <g className={reducedMotion ? "" : "animate-wheel-spin [transform-box:fill-box] [transform-origin:center]"}>
              <rect x="-1" y="-9" width="2" height="18" fill="#8d8f95" />
              <rect x="-9" y="-1" width="18" height="2" fill="#8d8f95" />
              <rect x="-7" y="-7" width="14" height="2" transform="rotate(45)" fill="#8d8f95" />
            </g>
            <circle r="2.3" fill="#6a6d73" />
          </g>

          {/* Right wheel */}
          <g transform="translate(86,40)">
            <circle r="10" fill="black" />
            <circle r="6.5" fill="#cfcfd2" />
            <g className={reducedMotion ? "" : "animate-wheel-spin [transform-box:fill-box] [transform-origin:center]"}>
              <rect x="-1" y="-9" width="2" height="18" fill="#8d8f95" />
              <rect x="-9" y="-1" width="18" height="2" fill="#8d8f95" />
              <rect x="-7" y="-7" width="14" height="2" transform="rotate(45)" fill="#8d8f95" />
            </g>
            <circle r="2.3" fill="#6a6d73" />
          </g>
        </svg>
      </div>

      {/* CHECKPOINT CARD — pause only when hovering/touching THIS card */}
      <div
        className={[
          "absolute left-1/2 bottom-[220px] md:bottom-[240px] -translate-x-1/2 w-[min(720px,92vw)] z-30",
          "rounded-2xl border border-muted bg-card/95 backdrop-blur-sm shadow-lg",
          "transition-transform duration-500",
          cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        ].join(" ")}
        onMouseEnter={() => setHoverPause(true)}
        onMouseLeave={() => setHoverPause(false)}
        onTouchStart={() => setHoverPause(true)}
        onTouchEnd={() => setHoverPause(false)}
      >
        {typeof activeIndex === "number" && (
          <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-4 p-4 md:p-6 items-center">
            <figure className="overflow-hidden rounded-xl border border-muted/60">
              <img
                src={checkpoints[activeIndex].imageSrc}
                alt={checkpoints[activeIndex].imageAlt}
                className="block w-full h-60 md:h-52 object-cover"
                loading="eager"
              />
            </figure>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Checkpoint</div>
              <h3 className="text-xl md:text-2xl font-semibold text-primary mb-1">
                {checkpoints[activeIndex].title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">{checkpoints[activeIndex].text}</p>
            </div>
          </div>
        )}
      </div>

      {/* PROGRESS BAR — eased and looping */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[min(760px,92vw)] z-20 top-6 pointer-events-none">
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden shadow-inner">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${Math.round(displayProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* SR-only list for accessibility */}
      <ol className="sr-only">
        {checkpoints.map((cp, i) => (
          <li key={cp.id ?? i} id={cp.id}>
            <h3>{cp.title}</h3>
            <p>{cp.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
