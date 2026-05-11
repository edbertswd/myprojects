// src/components/pets/Lamp.tsx
import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type Pointer = { x: number; y: number };

export type LampProps = {
  pointer: Pointer;
  onLanded?: () => void;
  onSettled?: () => void;
  onLookingAtUser?: (looking: boolean) => void;
  onNozzleChange?: (nozzle: { x: number; y: number }) => void;
  heightPx?: number;
  sizeEm?: number;
  playHop?: boolean;
  barColor?: string;
  lightOn?: boolean;
  /** When true, the lamp begins its backflip animation from the idle state. */
  triggerFlip?: boolean;
};

const clamp = (v: number, lo = -9999, hi = 9999) => Math.min(Math.max(v, lo), hi);

// Lamp-2: upright pose (for hopping & backflip)
const LAMP_UPRIGHT = "M27.257813 1.007813C26.824219 0.964844 26.378906 1.042969 25.976563 1.179688C25.175781 1.445313 24.390625 1.960938 23.675781 2.675781C22.960938 3.386719 22.445313 4.175781 22.179688 4.976563C21.914063 5.773438 21.867188 6.753906 22.558594 7.445313C23.460938 8.347656 23.996094 9.285156 24.339844 10.25C24.3125 10.273438 24.285156 10.296875 24.265625 10.324219L13.359375 22.222656C13.355469 22.222656 13.351563 22.226563 13.351563 22.226563C13.179688 22.371094 13.058594 22.566406 13.011719 22.785156L9.148438 32.445313C8.992188 32.671875 8.9375 32.949219 8.992188 33.214844C9.050781 33.480469 9.210938 33.714844 9.445313 33.859375L16 40.414063L16 43.03125C13.148438 43.164063 11.046875 43.855469 9.628906 44.585938C8.835938 44.992188 8.257813 45.40625 7.859375 45.734375C7.664063 45.902344 7.511719 46.046875 7.398438 46.160156C7.34375 46.21875 7.300781 46.269531 7.257813 46.324219C7.234375 46.351563 7.210938 46.375 7.179688 46.421875C7.167969 46.445313 7.148438 46.46875 7.117188 46.527344C7.105469 46.554688 7.085938 46.585938 7.0625 46.648438C7.054688 46.679688 7.027344 46.769531 7.027344 46.769531C7.027344 46.773438 7 47 7 47L7 48C7 48.550781 7.449219 49 8 49L26 49C26.550781 49 27 48.550781 27 48L27 47C27 46.761719 26.914063 46.53125 26.761719 46.347656C26.761719 46.347656 25.953125 45.433594 24.375 44.613281C22.957031 43.878906 20.855469 43.167969 18 43.03125L18 40.535156L23.554688 36.832031C23.816406 36.65625 23.980469 36.367188 24 36.054688C24.015625 35.738281 23.882813 35.433594 23.640625 35.234375L18.3125 30.792969L22.769531 23.65625C22.960938 23.429688 23.046875 23.132813 23 22.84375L23 15C23 14.898438 22.988281 14.800781 22.957031 14.703125L24.839844 12.65625C24.882813 13.082031 24.925781 13.511719 24.953125 13.953125C25.097656 16.300781 25.085938 18.914063 27.085938 20.914063C27.136719 20.96875 27.195313 21.015625 27.257813 21.054688C28.570313 22.207031 30.515625 22.207031 32.445313 21.5625C34.457031 20.890625 36.613281 19.507813 38.5625 17.5625C40.507813 15.613281 41.890625 13.457031 42.5625 11.445313C43.203125 9.523438 43.207031 7.589844 42.074219 6.28125C42.03125 6.214844 41.980469 6.152344 41.921875 6.097656C41.921875 6.09375 41.917969 6.089844 41.914063 6.085938C41.90625 6.078125 41.902344 6.074219 41.894531 6.070313C41.894531 6.066406 41.890625 6.066406 41.890625 6.0625C41.886719 6.0625 41.882813 6.058594 41.878906 6.054688C41.859375 6.039063 41.835938 6.023438 41.816406 6.007813C41.664063 5.863281 41.503906 5.734375 41.332031 5.625C39.164063 3.976563 36.804688 4.039063 34.769531 4C32.5625 3.957031 30.660156 3.851563 28.453125 1.570313C28.109375 1.214844 27.691406 1.050781 27.257813 1.007813 Z M 27.015625 2.960938C29.636719 5.667969 32.429688 5.957031 34.730469 6C34.882813 6.003906 35.015625 6.007813 35.164063 6.007813C34.398438 6.375 33.628906 6.839844 32.863281 7.382813C32.859375 7.386719 32.855469 7.386719 32.851563 7.390625C32.734375 7.445313 32.632813 7.523438 32.546875 7.621094C32.542969 7.621094 32.542969 7.621094 32.542969 7.625C31.828125 8.160156 31.121094 8.757813 30.4375 9.4375C29.734375 10.144531 29.113281 10.878906 28.566406 11.621094C28.527344 11.660156 28.492188 11.707031 28.457031 11.753906C27.863281 12.578125 27.363281 13.414063 26.972656 14.234375C26.964844 14.097656 26.957031 13.976563 26.949219 13.832031C26.800781 11.410156 26.453125 8.511719 23.96875 6.03125C24.042969 6.101563 23.941406 6.019531 24.078125 5.609375C24.214844 5.195313 24.566406 4.609375 25.089844 4.089844C25.613281 3.566406 26.195313 3.214844 26.609375 3.074219C27.027344 2.933594 27.09375 3.042969 27.015625 2.960938 Z M 38.808594 7.007813C39.417969 6.976563 39.898438 7.089844 40.246094 7.304688C40.332031 7.375 40.421875 7.4375 40.515625 7.515625C41.046875 8.066406 41.203125 9.199219 40.667969 10.8125C40.125 12.441406 38.902344 14.390625 37.144531 16.144531C35.390625 17.902344 33.441406 19.125 31.8125 19.667969C30.183594 20.207031 29.042969 20.042969 28.5 19.5C27.957031 18.957031 27.792969 17.816406 28.332031 16.1875C28.558594 15.511719 28.929688 14.769531 29.378906 14.019531C30.082031 14.628906 31 15 32 15C34.199219 15 36 13.199219 36 11C36 10 35.628906 9.082031 35.019531 8.378906C35.769531 7.929688 36.511719 7.558594 37.1875 7.335938C37.796875 7.128906 38.339844 7.027344 38.808594 7.007813 Z M 33.347656 9.53125C33.746094 9.894531 34 10.410156 34 11C34 12.117188 33.117188 13 32 13C31.410156 13 30.894531 12.746094 30.53125 12.347656C30.929688 11.84375 31.367188 11.339844 31.855469 10.855469C32.339844 10.367188 32.84375 9.929688 33.347656 9.53125 Z M 21 16.84375L21 22L16.273438 22 Z M 14.675781 24L20.195313 24L16.355469 30.144531L11.6875 31.480469 Z M 16.765625 32.105469L21.332031 35.910156L17.125 38.714844L11.90625 33.496094 Z M 16.863281 45.003906C16.957031 45.015625 17.046875 45.015625 17.136719 45.003906C20.121094 45.023438 22.164063 45.71875 23.453125 46.386719C24.089844 46.714844 24.035156 46.773438 24.320313 47L9.5625 47C9.835938 46.800781 10.085938 46.601563 10.542969 46.363281C11.832031 45.703125 13.875 45.023438 16.863281 45.003906Z";

// Lamp-1: looking sideways pose (facing the viewer)
const LAMP_LOOKING = "M30 1C24.488281 1 20 5.488281 20 11C20 14.414063 21.730469 17.429688 24.355469 19.234375L16.503906 25.121094C16.503906 25.121094 16.5 25.121094 16.5 25.125C16.28125 25.246094 16.113281 25.449219 16.035156 25.6875L12.1875 33.390625C12.003906 33.625 11.933594 33.925781 11.996094 34.214844C12.054688 34.503906 12.242188 34.753906 12.503906 34.890625L19 40.460938L19 43.03125C16.148438 43.164063 14.046875 43.855469 12.628906 44.585938C11.835938 44.992188 11.257813 45.40625 10.859375 45.734375C10.664063 45.902344 10.511719 46.046875 10.402344 46.160156C10.34375 46.21875 10.300781 46.269531 10.253906 46.324219C10.234375 46.351563 10.210938 46.375 10.183594 46.421875C10.167969 46.445313 10.148438 46.46875 10.121094 46.527344C10.105469 46.554688 10.085938 46.585938 10.0625 46.648438C10.054688 46.679688 10.027344 46.769531 10.027344 46.769531C10.027344 46.773438 10 47 10 47L10 48C10 48.550781 10.449219 49 11 49L29 49C29.550781 49 30 48.550781 30 48L30 47C30 46.761719 29.914063 46.53125 29.761719 46.347656C29.761719 46.347656 28.953125 45.433594 27.375 44.613281C25.957031 43.878906 23.855469 43.167969 21 43.03125L21 40.535156L26.554688 36.832031C26.832031 36.648438 27 36.335938 27 36C27 35.664063 26.832031 35.351563 26.554688 35.167969L21.570313 31.84375L24.558594 28.859375C24.6875 28.777344 24.796875 28.667969 24.875 28.535156L27.707031 25.707031C27.894531 25.519531 28 25.265625 28 25L28 20.796875C28.648438 20.929688 29.316406 21 30 21C35.511719 21 40 16.511719 40 11C40 5.488281 35.511719 1 30 1 Z M 30 3C34.429688 3 38 6.570313 38 11C38 15.429688 34.429688 19 30 19C25.570313 19 22 15.429688 22 11C22 6.570313 25.570313 3 30 3 Z M 30 7C27.800781 7 26 8.800781 26 11C26 13.199219 27.800781 15 30 15C32.199219 15 34 13.199219 34 11C34 8.800781 32.199219 7 30 7 Z M 30 9C31.117188 9 32 9.882813 32 11C32 12.117188 31.117188 13 30 13C28.882813 13 28 12.117188 28 11C28 9.882813 28.882813 9 30 9 Z M 26 20.15625L26 24.585938L23.707031 26.875L19.210938 25.59375L25.597656 20.800781C25.8125 20.648438 25.953125 20.414063 26 20.15625 Z M 17.523438 27.1875L22.09375 28.496094L19.476563 31.109375L14.910156 32.414063 Z M 19.828125 33.089844L24.199219 36L20.078125 38.75L15.0625 34.449219 Z M 19.863281 45.003906C19.957031 45.015625 20.046875 45.015625 20.136719 45.003906C23.121094 45.023438 25.164063 45.71875 26.453125 46.386719C27.089844 46.714844 27.035156 46.773438 27.320313 47L12.5625 47C12.835938 46.800781 13.085938 46.601563 13.542969 46.363281C14.832031 45.703125 16.875 45.023438 19.863281 45.003906Z";

export default function Lamp({
  pointer,
  onLanded,
  onSettled,
  onLookingAtUser,
  onNozzleChange,
  heightPx,
  sizeEm = 2.6,
  playHop = true,
  barColor = "currentColor",
  lightOn = true,
  triggerFlip = false,
}: LampProps) {
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nozzleRef = useRef<SVGCircleElement | null>(null);

  // Phases: hopping → idle → flipping → looking → done
  const [phase, setPhase] = useState<"hopping" | "idle" | "flipping" | "looking" | "done">(
    reduce ? "done" : "hopping"
  );

  // External trigger to start the backflip after the lamp has landed
  useEffect(() => {
    if (triggerFlip && phase === "idle") {
      setPhase("flipping");
    }
  }, [triggerFlip, phase]);
  const [tilt, setTilt] = useState(0);

  const BASE_CENTER_X = 20;
  const BASE_Y = 48;
  const HEAD_Y = 7;

  // Cursor tracking after fully settled
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || phase !== "done") return;

    const box = svg.getBoundingClientRect();
    const baseX = box.left + (BASE_CENTER_X / 50) * box.width;

    const dx = pointer.x - baseX;
    const maxTilt = 24;
    setTilt(clamp(-dx * 0.05, -maxTilt, maxTilt));

    onLookingAtUser?.(Math.abs(dx) < 80);

    const nozzle = nozzleRef.current?.getBoundingClientRect();
    if (nozzle) {
      onNozzleChange?.({
        x: nozzle.left + nozzle.width / 2,
        y: nozzle.top + nozzle.height / 2,
      });
    }
  }, [pointer, onLookingAtUser, onNozzleChange, phase]);

  const wrapSize: React.CSSProperties = heightPx
    ? { width: `${heightPx}px`, height: `${heightPx}px` }
    : { width: `${sizeEm}em`, height: `${sizeEm}em` };

  // === PHASE 1: Hop in ===
  const hopInitial = reduce
    ? { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
    : { x: 200, y: 0, scaleX: 1, scaleY: 1, rotate: 0 };
  const hopAnimate = reduce
    ? { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
    : {
        x:      [200, 200,  120,   50,    0,   -4,   0],
        y:      [0,    0,   -40,    0,  -18,    0,   0],
        scaleX: [1,  0.92, 1.06, 0.95, 1.03, 0.99,  1],
        scaleY: [1,  1.12, 0.94, 1.07, 0.97, 1.01,  1],
        rotate: [0,   -3,   -4,    2,   -2,    0,   0],
      };
  const hopTransition = reduce
    ? { duration: 0 }
    : {
        duration: 1.3,
        ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeOut"],
        times: [0, 0.08, 0.32, 0.62, 0.85, 0.94, 1] as number[],
      };

  // === PHASE 2: Backflip ===
  const flipAnimate =
    phase === "flipping"
      ? {
          y:      [0, -50, -55, -30,  0,  6,  0],
          scaleX: [1, 0.9,   1,   1, 0.94, 1.02, 1],
          scaleY: [1, 1.15, 0.95, 1, 1.08, 0.98, 1],
          rotate: [0,  -40, -100, -150, -180, -183, -180],
        }
      : phase === "looking" || phase === "done"
      ? { y: 0, scaleX: 1, scaleY: 1, rotate: -180 }
      : { y: 0, scaleX: 1, scaleY: 1, rotate: 0 };

  const flipTransition =
    phase === "flipping"
      ? {
          duration: 0.85,
          ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeOut"],
          times: [0, 0.15, 0.4, 0.65, 0.82, 0.92, 1] as number[],
        }
      : { duration: 0 };

  // Which SVG to show
  const showLooking = phase === "looking" || phase === "done";

  return (
    <motion.span
      aria-hidden
      className="inline-block align-baseline relative"
      style={{ ...wrapSize, transformOrigin: "50% 100%" }}
      initial={hopInitial}
      animate={hopAnimate}
      transition={hopTransition}
      onAnimationComplete={() => {
        if (phase === "hopping") {
          setPhase("idle");
          onLanded?.();
        }
      }}
    >
      {/* Inner wrapper: backflip rotation */}
      <motion.div
        style={{ display: "block", transformOrigin: "50% 50%", width: "100%", height: "100%" }}
        animate={flipAnimate}
        transition={flipTransition}
        onAnimationComplete={() => {
          if (phase === "flipping") {
            setPhase("looking");
            // Brief pause in "looking" pose, then settle
            setTimeout(() => {
              setPhase("done");
              onSettled?.();
            }, 500);
          }
        }}
      >
        <motion.svg
          ref={svgRef}
          viewBox="0 0 50 50"
          className="block"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="lampBeamGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,245,200,0.5)" />
              <stop offset="60%" stopColor="rgba(255,245,200,0.18)" />
              <stop offset="100%" stopColor="rgba(255,245,200,0)" />
            </linearGradient>
            <radialGradient id="lampGlow" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stopColor="rgba(255,250,220,0.65)" />
              <stop offset="100%" stopColor="rgba(255,250,220,0)" />
            </radialGradient>
            <filter id="lampBeamBlur" x="-30%" y="-10%" width="160%" height="130%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
            </filter>
          </defs>

          {/* Tilt group for cursor tracking */}
          <motion.g
            style={{
              transformBox: "view-box",
              transformOrigin: `${BASE_CENTER_X}px ${BASE_Y}px`,
            }}
            animate={{ rotate: phase === "done" ? tilt : 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            {/* Upright pose — mirrored to face left (moving right→left) */}
            <motion.g
              animate={{ opacity: showLooking ? 0 : 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              transform="translate(50, 0) scale(-1, 1)"
            >
              <path d={LAMP_UPRIGHT} fill={barColor} />
              {/* Glow on the upright bulb — visible whenever the light is on */}
              <motion.circle
                cx="32"
                cy="11"
                r="14"
                fill="url(#lampGlow)"
                animate={
                  lightOn && !showLooking
                    ? { opacity: [0, 0.85, 0.3, 0.75] }
                    : { opacity: 0 }
                }
                transition={
                  lightOn && !showLooking
                    ? { duration: 0.35, ease: "easeOut", times: [0, 0.3, 0.6, 1] }
                    : { duration: 0 }
                }
              />
            </motion.g>

            {/* Looking pose — crossfades in after backflip */}
            <motion.path
              d={LAMP_LOOKING}
              fill={barColor}
              animate={{ opacity: showLooking ? 1 : 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />

            {/* Beam cone + glow — full beam shown in looking pose */}
            <motion.g
              animate={
                lightOn && showLooking
                  ? { opacity: [0, 0.8, 0.25, 1] }
                  : { opacity: 0 }
              }
              transition={
                lightOn && showLooking
                  ? { duration: 0.35, ease: "easeOut", times: [0, 0.3, 0.6, 1] }
                  : { duration: 0 }
              }
            >
              <circle cx="30" cy="11" r="12" fill="url(#lampGlow)" opacity="0.6" />
              <polygon
                points="26,17 8,62 52,62 34,17"
                fill="url(#lampBeamGrad)"
                filter="url(#lampBeamBlur)"
              />
            </motion.g>

            {/* Nozzle ref */}
            <circle ref={nozzleRef} cx="30" cy={HEAD_Y} r={0.5} fill="transparent" />
          </motion.g>
        </motion.svg>
      </motion.div>
    </motion.span>
  );
}
