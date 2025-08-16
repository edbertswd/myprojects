import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "motion";
import type { AnimationPlaybackControls } from "motion";


type Checkpoint = {
  t: number;        // 0..1 along the road centerline
  title: string;
  text: string;
};

const About = () => {
  // 7 checkpoints across the S-road (0 -> 6); car stops at index 6 (the 7th)
  const checkpoints: Checkpoint[] = useMemo(
    () => [
      { t: 0.04, title: "Beginnings",   text: "Youngest kid—had to earn my stripes." },
      { t: 0.16, title: "First Build",   text: "Shipped my first site—got hooked on shipping." },
      { t: 0.30, title: "Design Lens",   text: "UX & accessibility started guiding everything." },
      { t: 0.46, title: "Teamwork",      text: "Feedback → iterate → own it. Repeat." },
      { t: 0.62, title: "Grit",          text: "Hard bugs taught calm and systems thinking." },
      { t: 0.82, title: "Momentum",      text: "Build faster by building simpler." },
      { t: 0.94, title: "What's next?",  text: "What's next for me… 🚀" }, // last bubble pops at end
    ],
    []
  );

// Keep bubbles clear of the road (28px stroke) with a comfortable margin
const ROAD_STROKE = 28;
const BUBBLE_GAP = Math.round(ROAD_STROKE / 2 + 18); // ~32px


  // S-road path (spans full width)
  const pathD =
    `
      M 10 500
      C 190 500, 190 80, 370 80
      S 550 500, 730 500
      S 910 80, 990 80
    `;

  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [len, setLen] = useState(1);
  const [pts, setPts] = useState<{ x: number; y: number; angle: number }[]>([]);
  const [progress, setProgress] = useState(0); // 0..tEnd
  const [passed, setPassed] = useState<boolean[]>(() => checkpoints.map(() => false));
  const [bubbleAnimating, setBubbleAnimating] = useState<boolean[]>(() => checkpoints.map(() => false));
  const [hiddenBubbles, setHiddenBubbles] = useState<Set<number>>(new Set()); // Track manually hidden bubbles

// animation control + running state
const controlsRef = useRef<AnimationPlaybackControls | null>(null);
const [isRunning, setIsRunning] = useState(false);


const tEnd = checkpoints[6].t; // stop at checkpoint #6 (index 6)

  // Compute length, checkpoint positions (centerline), and tangents (for bubble orientation)
  useEffect(() => {
    const compute = () => {
      const p = pathRef.current;
      const svg = svgRef.current;
      if (!p || !svg) return;
      
      const L = p.getTotalLength();
      setLen(L);

      // Use SVG's built-in coordinate transformation
      const svgPoint = svg.createSVGPoint();

      const out = checkpoints.map(({ t }) => {
        const s = L * t;
        const pt = p.getPointAtLength(s);
        
        // Set the SVG point to the path coordinates
        svgPoint.x = pt.x;
        svgPoint.y = pt.y;
        
        // Transform to screen coordinates
        const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM());
        
        // Get the container's position to make coordinates relative to it
        const containerRect = svg.getBoundingClientRect();
        const x = screenPoint.x - containerRect.left;
        const y = screenPoint.y - containerRect.top;
        
        // Calculate tangent for bubble positioning
        const p1 = p.getPointAtLength(Math.max(0, s - 1));
        const p2 = p.getPointAtLength(Math.min(L, s + 1));
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x); // radians
        
        return { x, y, angle };
      });
      setPts(out);
    };

    // Use requestAnimationFrame for better timing
    const computeDelayed = () => {
      requestAnimationFrame(compute);
    };

    computeDelayed();
    const ro = new ResizeObserver(computeDelayed);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', computeDelayed);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeDelayed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/stop the car animation when `isRunning` toggles
useEffect(() => {
  if (!isRunning) return;

  // reset visual state at the moment we start
  setProgress(0);
  setPassed(checkpoints.map(() => false));
  setBubbleAnimating(checkpoints.map(() => false));
  setHiddenBubbles(new Set());

  const controls = animate(0, tEnd, {
    duration: 16, //how fast the car moves
    easing: "linear",
    onUpdate: (v) => {
      setProgress(v);
      setPassed((prev) => {
        const next = [...prev];
        checkpoints.forEach((checkpoint, i) => {
          const triggerOffset = 0.0;
          if (!next[i] && v >= checkpoint.t - triggerOffset) {
            next[i] = true;
            setTimeout(() => {
              setBubbleAnimating((prevAnimating) => {
                const na = [...prevAnimating];
                na[i] = true;
                return na;
              });
              // auto-hide all except last
              setTimeout(() => {
                if (i !== checkpoints.length - 1) {
                  setHiddenBubbles((prevHidden) => new Set([...prevHidden, i]));
                }
              }, 2000); //how many seconds
            }, 50);
          }
        });
        return next;
      });
    },
    onComplete: () => {
      setPassed((prev) => prev.map(() => true));
      setBubbleAnimating((prev) => prev.map(() => true));
      setIsRunning(false);
    },
  });

  controlsRef.current = controls;
  return () => controls.cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isRunning, tEnd, checkpoints]);
  // Car position (centerline) + rotation aligned to tangent
  const car = useMemo(() => {
    const p = pathRef.current;
    const svg = svgRef.current;
    if (!p || !svg) return null;
    
    const s = len * Math.min(Math.max(progress, 0), tEnd);
    const pt = p.getPointAtLength(s);
    
    // Use SVG's built-in coordinate transformation
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = pt.x;
    svgPoint.y = pt.y;
    
    // Transform to screen coordinates
    const screenPoint = svgPoint.matrixTransform(svg.getScreenCTM());
    
    // Get the container's position to make coordinates relative to it
    const containerRect = svg.getBoundingClientRect();
    const x = screenPoint.x - containerRect.left;
    const y = screenPoint.y - containerRect.top;
    
    // Calculate rotation
    const p1 = p.getPointAtLength(Math.max(0, s - 1));
    const p2 = p.getPointAtLength(Math.min(len, s + 1));
    const angleDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    
    return { x, y, angleDeg };
  }, [len, progress, tEnd]);

  // Progress stroke (color the road we've passed)
  const dashOffset = useMemo(() => {
    const progressed = len * Math.min(progress, tEnd);
    return Math.max(0, len - progressed);
  }, [len, progress, tEnd]);

  // Handle bubble hide on hover
  const handleBubbleHover = (index: number) => {
    setHiddenBubbles(prev => new Set([...prev, index]));
  };

  // Bubble side based on road tangent (keeps arrows pointing at pins)
  const sideForAngle = (angleRad: number): "top" | "bottom" => {
    // Simple rule: if the path is trending downward (dy>0), put bubble on TOP; else BOTTOM.
    // You can swap this if you prefer the opposite.
    const dy = Math.sin(angleRad);
    return dy > 0 ? "top" : "bottom";
  };

  const bubbleStyle = (side: "top" | "right" | "bottom" | "left") => {
    switch (side) {
      case "top":
        return {
          wrapTransform: "translate(-50%, calc(-100% - 12px))",
          arrowStyle: { left: "50%", top: "100%", transform: "translate(-50%, -50%) rotate(45deg)" } as const,
        };
      case "bottom":
        return {
          wrapTransform: "translate(-50%, 12px)",
          arrowStyle: { left: "50%", top: "0%", transform: "translate(-50%, -50%) rotate(45deg)" } as const,
        };
      case "right":
        return {
          wrapTransform: "translate(12px, -50%)",
          arrowStyle: { left: "0%", top: "50%", transform: "translate(-50%, -50%) rotate(45deg)" } as const,
        };
      case "left":
      default:
        return {
          wrapTransform: "translate(calc(-100% - 12px), -50%)",
          arrowStyle: { left: "100%", top: "50%", transform: "translate(-50%, -50%) rotate(45deg)" } as const,
        };
    }
  };

  return (
    <section id="about" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-portfolio-dark mb-3">My Journey</h2>
          <p className="text-portfolio-gray text-lg max-w-2xl mx-auto">
            A winding road—each checkpoint changed how I build and who I am.
          </p>
        </div>
        <div className="mb-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              // cancel any existing animation before starting fresh
              controlsRef.current?.cancel();
              setIsRunning(true);
            }}
            disabled={isRunning}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-60 shadow hover:shadow-md transition"
          >
            {isRunning ? "Driving..." : "Start"}
          </button>

          {/* Optional: a Reset button if you want to jump back to the start instantly */}
          <button
            type="button"
            onClick={() => {
              controlsRef.current?.cancel();
              setIsRunning(false);
              setProgress(0);
              setPassed(checkpoints.map(() => false));
              setBubbleAnimating(checkpoints.map(() => false));
              setHiddenBubbles(new Set());
            }}
            className="px-3 py-2 rounded-lg border border-muted text-foreground hover:bg-muted/30 transition"
          >
            Reset
          </button>
        </div>

        <div ref={wrapRef} className="relative w-full max-w-6xl mx-auto">
          {/* SVG: S-road full width */}
          <svg 
            ref={svgRef}
            viewBox="0 0 1000 560" 
            className="w-full h-[520px] block" 
            aria-hidden
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Base road */}
            <path
              ref={pathRef}
              d={pathD}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="28"
              strokeLinecap="round"
              className="drop-shadow-sm"
            />
            {/* Progress road overlay (colored) */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="28"
              strokeLinecap="round"
              strokeDasharray={`${len} ${len}`}
              strokeDashoffset={dashOffset}
              style={{ transition: "none" }} // Remove transition to eliminate lag
            />
            {/* Center dashed line */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeDasharray="10 14"
              strokeLinecap="round"
              opacity="0.45"
            />
          </svg>

          {/* Pins + bubbles on exact road centerline */}
          <div className="absolute inset-0">
            {pts.length === checkpoints.length &&
              checkpoints.map((checkpoint, i) => {
                const { x, y, angle } = pts[i];
                const side = sideForAngle(angle);
                const { wrapTransform, arrowStyle } = bubbleStyle(side);
                const isShown = passed[i] && !hiddenBubbles.has(i);
                const isAnimated = bubbleAnimating[i];

                return (
                  <div
                    key={i}
                    className="group absolute"
                    style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
                    onMouseEnter={() => handleBubbleHover(i)}
                  >
                    {/* pin (center of road) */}
                    <button
                      className="relative w-6 h-6 rounded-full bg-primary ring-2 ring-background shadow outline-none focus:ring-4 focus:ring-primary/40"
                      aria-label={checkpoint.title}
                    >
                      <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
                    </button>

                    {/* bubble */}
                    <div
                      className={[
                        "absolute z-10 min-w-[14rem] max-w-[18rem] rounded-xl border border-muted",
                        "bg-card text-foreground shadow-lg p-4 transition-all duration-300 ease-out",
                        isShown && isAnimated 
                          ? "opacity-100 scale-100 translate-y-0" 
                          : "opacity-0 scale-75 translate-y-3",
                        "group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0", 
                        "group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:translate-y-0",
                      ].join(" ")}
                      style={{ transform: wrapTransform }}
                    >
                      <div className="text-sm font-semibold text-primary">{checkpoint.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{checkpoint.text}</div>
                      {/* arrow */}
                      <div
                        className="absolute w-3 h-3 bg-card border-l border-t border-muted"
                        style={arrowStyle}
                      />
                    </div>
                  </div>
                );
              })}

            {/* Car (moves from cp0 to cp6, then stops) */}
            {car && (
              <div
                className="absolute"
                style={{
                  left: car.x,
                  top: car.y,
                  transform: `translate(-50%, -50%) rotate(${car.angleDeg}deg)`,
                }}
                aria-hidden
              >
                {/* Better looking car */}
                <svg width="72" height="36" viewBox="0 0 72 36" className="drop-shadow-lg">
                  {/* Car body shadow */}
                  <ellipse cx="36" cy="32" rx="28" ry="3" fill="black" opacity="0.2" />
                  
                  {/* Main car body */}
                  <rect x="8" y="14" rx="6" ry="6" width="48" height="14" fill="hsl(var(--primary))" />
                  
                  {/* Car roof */}
                  <rect x="20" y="8" rx="4" ry="4" width="24" height="10" fill="hsl(var(--primary))" />
                  
                  {/* Front and rear bumpers */}
                  <rect x="4" y="16" rx="2" ry="2" width="6" height="10" fill="hsl(var(--primary))" />
                  <rect x="62" y="16" rx="2" ry="2" width="6" height="10" fill="hsl(var(--primary))" />
                  
                  {/* Windows */}
                  <rect x="22" y="10" width="8" height="6" rx="2" fill="hsl(var(--background))" opacity="0.9" />
                  <rect x="34" y="10" width="8" height="6" rx="2" fill="hsl(var(--background))" opacity="0.9" />
                  <rect x="46" y="10" width="8" height="6" rx="2" fill="hsl(var(--background))" opacity="0.9" />
                  
                  {/* Side windows */}
                  <rect x="12" y="16" width="6" height="8" rx="1" fill="hsl(var(--background))" opacity="0.8" />
                  <rect x="54" y="16" width="6" height="8" rx="1" fill="hsl(var(--background))" opacity="0.8" />
                  
                  {/* Wheels */}
                  <circle cx="20" cy="30" r="6" fill="hsl(var(--foreground))" />
                  <circle cx="52" cy="30" r="6" fill="hsl(var(--foreground))" />
                  
                  {/* Wheel rims */}
                  <circle cx="20" cy="30" r="3" fill="hsl(var(--muted))" />
                  <circle cx="52" cy="30" r="3" fill="hsl(var(--muted))" />
                  
                  {/* Headlights */}
                  <circle cx="66" cy="18" r="2" fill="white" opacity="0.9" />
                  <circle cx="66" cy="24" r="2" fill="white" opacity="0.9" />
                  
                  {/* Taillights */}
                  <circle cx="6" cy="18" r="1.5" fill="red" opacity="0.8" />
                  <circle cx="6" cy="24" r="1.5" fill="red" opacity="0.8" />
                  
                  {/* Car details */}
                  <rect x="8" y="20" width="48" height="1" fill="hsl(var(--primary-foreground))" opacity="0.3" />
                  <rect x="30" y="8" width="1" height="10" fill="hsl(var(--primary-foreground))" opacity="0.2" />
                  <rect x="42" y="8" width="1" height="10" fill="hsl(var(--primary-foreground))" opacity="0.2" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* optional copy area */}
        <div className="mt-10 grid lg:grid-cols-2 gap-8">
          <p className="text-portfolio-gray leading-relaxed">
            The road isn't straight—every bend came with a lesson worth keeping.
          </p>
          <p className="text-portfolio-gray leading-relaxed">
            I'm focused on reliable, accessible tools that feel effortless. The journey continues.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;