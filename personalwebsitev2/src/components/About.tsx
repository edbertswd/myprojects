import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";

// Import city images
import city7 from "/src/assets/city/7.png";

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
      { t: 0.04, id: "chapter-beginnings", title: "Beginnings", text: "Born in 2002, the youngest — learned to be heard." },
      { t: 0.16, id: "chapter-jakarta", title: "High School in Jakarta", text: "Tried everything I wanted (mostly video games though unfortunately)."},
      { t: 0.36, id: "chapter-atlanta", title: "Atlanta & Covid Era", text: "Moved to Atlanta and learned how to code. First Hello World."},
      { t: 0.52, id: "chapter-sydney", title: "Sydney Chapter", text: "Moved to Sydney for my girlfriend. Worked hard to build a strong future here." },
      { t: 0.66, id: "chapter-content", title: "Content Creation Era", text: "Built a Twitch community of 1.8k — learned content creating and networking." },
      { t: 0.80, id: "chapter-gamedev", title: "Locked In Era", text: "Decided I had to specialize and chose two areas: web development and game development." },
      { t: 0.92, id: "chapter-next", title: "What's Next?", text: "Still writing the story — excited for the next thing!" },
    ],
    []
  );

  // --- STATE ---
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);               // 0..1 (drives world)
  const [pausedProgress, setPausedProgress] = useState<number | null>(null); // Store progress when paused
  const [hoverPause, setHoverPause] = useState(false);
  const [clickPause, setClickPause] = useState(false);
  const [pausedCheckpoint, setPausedCheckpoint] = useState<Checkpoint | null>(null);       
  const [autoplayZone, setAutoplayZone] = useState(false);   // ≥30% visible
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const playing = autoplayZone && !hoverPause && !clickPause && !reducedMotion;

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
      // Use paused progress if resuming, otherwise use current progress
      const startProgress = pausedProgress !== null ? pausedProgress : progress;
      const remaining = Math.max(0, 1 - startProgress);
      const duration = Math.max(0.2, baseDuration * remaining);
      
      const ctrl = animate(startProgress, 1, {
        duration,
        easing: (t) => t,
        onUpdate: (v) => setProgress(v),
        onComplete: () => {
          // Simple reset: set to 0 and restart
          setProgress(0);
          setPausedProgress(null);
          if (playing) {
            // Restart the run function after a brief reset
            setTimeout(run, 50);
          }
        },
      });
      controlsRef.current = ctrl;
    };

    // Clear paused progress when starting fresh animation
    if (pausedProgress !== null) {
      setPausedProgress(null);
    }
    
    run();
    return () => controlsRef.current?.cancel();
  }, [playing]);

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

      {/* LARGE CENTERED INSTRUCTION TEXT - high visibility with pixel font */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 text-center pointer-events-none"
        style={{
          textShadow: "4px 4px 0px rgba(0,0,0,1), 2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)",
          fontFamily: "'Pixelify Sans', sans-serif",
        }}
      >
        <h2 className="text-white text-4xl md:text-5xl font-black mb-2" style={{ color: "#ffffff" }}>
          Catch the Sign!
        </h2>
        <p className="text-yellow-300 text-lg md:text-xl font-bold" style={{ color: "#fde047" }}>
          Click to pause and read each milestone
        </p>
      </div>

      {/* PAUSED OVERLAY - centered sign with zoom animation */}
      {clickPause && pausedCheckpoint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div 
            className="transform scale-100 transition-all duration-500 ease-out"
            style={{
              animation: "zoomIn 0.5s ease-out",
            }}
          >
            <style>{`
              @keyframes zoomIn {
                0% { 
                  transform: scale(0.8);
                  opacity: 0;
                }
                100% { 
                  transform: scale(1);
                  opacity: 1;
                }
              }
            `}</style>
            
            {/* Enlarged road sign */}
            <div 
              className="relative bg-green-700 text-white rounded-xl shadow-2xl border-4 border-white mb-6"
              style={{
                width: "400px",
                padding: "24px 32px",
                background: "linear-gradient(135deg, #166534 0%, #15803d 100%)",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Mile marker number */}
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-lg border-3 border-white">
                {checkpoints.findIndex(cp => cp.id === pausedCheckpoint.id) + 1}
              </div>
              
              {/* Sign content */}
              <div className="text-center">
                <div className="text-yellow-200 text-sm font-semibold uppercase tracking-wider mb-2">
                  MILESTONE
                </div>
                <h3 className="text-white text-2xl font-bold mb-3 leading-tight">
                  {pausedCheckpoint.title}
                </h3>
                <p className="text-green-100 text-base leading-relaxed">
                  {pausedCheckpoint.text}
                </p>
              </div>
              
              {/* Highway sign reflection effect */}
              <div 
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                  animation: "shimmer 3s infinite",
                }}
              />
            </div>
            
            {/* Resume button centered below sign */}
            <div className="text-center">
              <button
                onClick={() => {
                  setClickPause(false);
                  setPausedCheckpoint(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors shadow-lg"
              >
                ▶ Resume Journey
              </button>
            </div>
          </div>
        </div>
      )}
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

        /* Animation keyframes */
        @keyframes exhaust { 
          0% { opacity: 1; transform: translateX(0) scale(1); } 
          100% { opacity: 0; transform: translateX(-20px) scale(0.6); } 
        }
        
        @keyframes car-bob { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-2px); } 
        }
        
        @keyframes wheel-spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }

        .animate-exhaust { animation: exhaust 1.8s ease-out infinite; }
        .animate-car-bob { animation: car-bob 2.4s ease-in-out infinite; }
        .animate-wheel-spin { animation: wheel-spin 0.8s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .animate-road { animation-play-state: paused !important; }
          .strip       { animation-play-state: paused !important; }
          .animate-exhaust { animation-play-state: paused !important; }
          .animate-car-bob { animation-play-state: paused !important; }
          .animate-wheel-spin { animation-play-state: paused !important; }
        }
      `}</style>

      {/* SINGLE CITY LAYER - using imported image 3 */}
      <div
        className={[
          "strip absolute inset-0",
          playing && !reducedMotion ? "is-playing" : "",
        ].join(" ")}
        style={{
          ["--tile" as any]: "1200px",
          ["--duration" as any]: "80s",
          backgroundImage: `url(${city7})`,
          backgroundSize: "1200px 100%",
          backgroundPosition: "center bottom",
        }}
        aria-hidden
      />

      {/* ROAD */}
      <div className="absolute left-0 right-0 bottom-8 md:bottom-12 h-28 md:h-32 pointer-events-none" aria-hidden>
        <div
          className={`${playing && !reducedMotion ? "animate-road" : ""} absolute inset-x-[-200px] -inset-y-2 rounded-[18px]`}
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="480" height="128" viewBox="0 0 480 128">
                <defs>
                  <pattern id="asphalt" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="#2a2a2a"/>
                    <circle cx="8" cy="12" r="0.5" fill="#333"/>
                    <circle cx="22" cy="8" r="0.3" fill="#1a1a1a"/>
                    <circle cx="35" cy="25" r="0.4" fill="#333"/>
                    <circle cx="15" cy="30" r="0.2" fill="#444"/>
                    <circle cx="32" cy="5" r="0.3" fill="#1a1a1a"/>
                  </pattern>
                </defs>
                <rect width="480" height="128" fill="url(#asphalt)"/>
                <rect x="0" y="62" width="480" height="4" fill="#444"/>
              </svg>
            `)}")`,
            backgroundRepeat: "repeat-x",
            backgroundSize: "480px 100%",
            filter: "contrast(0.98) brightness(0.95)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.28), inset 0 8px 28px rgba(0,0,0,0.35)",
          }}
        />
        <div
          className={`${playing && !reducedMotion ? "animate-road" : ""} absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2`}
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, #ffff88 0 24px, transparent 24px 54px)",
            opacity: 0.8,
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

      {/* MILESTONE ROAD SIGNS — positioned along the journey route */}
      {checkpoints.map((checkpoint, index) => {
        const checkpointProgress = checkpoint.t;
        const approachDistance = 0.05; // How early the sign becomes visible
        const passDistance = 0.05; // How long the sign stays visible after passing
        
        const isApproaching = progress >= (checkpointProgress - approachDistance) && progress < checkpointProgress;
        const isPassing = progress >= checkpointProgress && progress <= (checkpointProgress + passDistance);
        const isVisible = isApproaching || isPassing;
        
        if (!isVisible) return null;
        
        // Calculate sign position based on progress relative to checkpoint
        let signPosition;
        if (isApproaching) {
          // Sign starts far right and moves toward center
          const approachProgress = (progress - (checkpointProgress - approachDistance)) / approachDistance;
          signPosition = 100 - (approachProgress * 60); // Move from 100% to 40% from right
        } else {
          // Sign continues moving left as we pass it
          const passingProgress = (progress - checkpointProgress) / passDistance;
          signPosition = 40 - (passingProgress * 80); // Move from 40% to -40% from right
        }
        
        return (
          <div
            key={checkpoint.id || index}
            className="absolute top-1/2 -translate-y-1/2 z-30 cursor-pointer"
            style={{
              right: `${signPosition}%`,
              opacity: isVisible ? 1 : 0,
              transform: `translateY(-50%) scale(${isApproaching ? 0.8 + (1 - (progress - (checkpointProgress - approachDistance)) / approachDistance) * 0.2 : 1})`,
            }}
            onClick={() => {
              setPausedProgress(progress); // Store current progress when pausing
              setClickPause(true);
              setPausedCheckpoint(checkpoint);
            }}
          >
            {/* Highway-style road sign */}
            <div 
              className="relative bg-green-700 text-white rounded-lg shadow-2xl border-4 border-white"
              style={{
                minWidth: "280px",
                maxWidth: "320px",
                padding: "16px 20px",
                background: "linear-gradient(135deg, #166534 0%, #15803d 100%)",
                boxShadow: "0 15px 30px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.2)",
              }}
            >
              {/* Mile marker number */}
              <div className="absolute -top-2 -left-2 w-7 h-7 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-xs border-2 border-white">
                {index + 1}
              </div>
              
              {/* Sign content */}
              <div className="text-center">
                <div className="text-yellow-200 text-xs font-semibold uppercase tracking-wider mb-1">
                  MILESTONE
                </div>
                <h3 className="text-white text-lg font-bold mb-1 leading-tight">
                  {checkpoint.title}
                </h3>
                <p className="text-green-100 text-xs leading-relaxed">
                  {checkpoint.text}
                </p>
              </div>
              
              {/* Highway sign reflection effect */}
              <div 
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                  animation: "shimmer 3s infinite",
                }}
              />
            </div>
            
            {/* Support post - extends from sign to road level */}
            <div 
              className="absolute left-1/2 top-full w-2 bg-gray-600 -translate-x-1/2"
              style={{
                background: "linear-gradient(to right, #4a5568, #718096)",
                height: "calc(50vh + 6rem)", // From middle of screen down to road level
                bottom: "calc(-50vh - 6rem)", // Position it to reach the road
              }}
            />
          </div>
        );
      })}

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* PROGRESS BAR — smooth CSS transition */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[min(760px,92vw)] z-20 top-6 pointer-events-none">
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden shadow-inner">
          <div
            className="h-full bg-primary transition-all duration-150 ease-out"
            style={{ 
              width: `${Math.round(progress * 100)}%`,
              transitionProperty: 'width'
            }}
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