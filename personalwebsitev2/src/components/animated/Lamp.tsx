// src/components/pets/Lamp.tsx
import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type Pointer = { x: number; y: number };

export type LampProps = {
  pointer: Pointer;
  onSettled?: () => void;
  onLookingAtUser?: (looking: boolean) => void;
  onNozzleChange?: (nozzle: { x: number; y: number }) => void;
  heightPx?: number;
  sizeEm?: number;
  playHop?: boolean;
  /** Color for base + bars; defaults to current text color */
  barColor?: string;
};

function angleDeg(ax: number, ay: number, bx: number, by: number) {
  return (Math.atan2(by - ay, bx - ax) * 180) / Math.PI; // 0°=right, 90°=down, 180°=left
}
function norm180(d: number) {
  let a = d % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
}
const clamp = (v: number, lo = -9999, hi = 9999) => Math.min(Math.max(v, lo), hi);

export default function Lamp({
  pointer,
  onSettled,
  onLookingAtUser,
  onNozzleChange,
  heightPx,
  sizeEm = 2.6,
  playHop = true,
  barColor = "currentColor",
}: LampProps) {
  const reduce = useReducedMotion();
  const barFill = barColor;

  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nozzleRef = useRef<SVGCircleElement | null>(null);

  // Flip happens ONLY after the jump (start upright)
  const [isFlipped, setIsFlipped] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  // viewBox geometry (120 x 140)
  const BASE = { x: 35, y: 112, w: 58, h: 10, rx: 4 };
  const BASE_PIVOT = { x: BASE.x + BASE.w / 2, y: BASE.y + BASE.h / 2 }; // (64,117)
  const HINGE = { x: 80, y: 47 };
  const NECK_RIGHT_X = 76;
  const TIP = { x: 108, y: 46 };

  // Start FACING LEFT (upright): 180°. During intro we animate to 90° (down).
  const [barAngle, setBarAngle] = useState(180);
  const [beamLen, setBeamLen] = useState(240);
  const [beamThick, setBeamThick] = useState(260);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const box = svg.getBoundingClientRect();
    const baseX = box.left + (BASE_PIVOT.x / 120) * box.width;
    const baseY = box.top + (BASE_PIVOT.y / 140) * box.height;

    if (introDone) {
      // After intro: normal ±90° pendulum around down (90°)
      const raw = angleDeg(baseX, baseY, pointer.x, pointer.y);
      const deltaFromDown = norm180(raw - 90);
      const clamped = clamp(deltaFromDown, -90, 90);
      setBarAngle(90 + clamped);
      onLookingAtUser?.(Math.abs(deltaFromDown) < 12);
    }

    // Beam sizing
    const tip = nozzleRef.current?.getBoundingClientRect();
    if (tip) {
      const tx = tip.left + tip.width / 2;
      const ty = tip.top + tip.height / 2;
      onNozzleChange?.({ x: tx, y: ty });
      const dx = pointer.x - tx;
      const dy = pointer.y - ty;
      const dist = Math.hypot(dx, dy);
      const len = clamp(dist - 4, 140, 900);
      setBeamLen(len);
      setBeamThick(clamp(len * 0.52, 200, 440));
    }
  }, [pointer, onLookingAtUser, onNozzleChange, introDone]);

  const aspect = 120 / 140;
  const wrapSize: React.CSSProperties = heightPx
    ? { width: `${heightPx * aspect}px`, height: `${heightPx}px` }
    : { width: `${sizeEm}em`, height: `${sizeEm}em` };
  const wrapStyle: React.CSSProperties = {
    ...wrapSize,
    transformOrigin: "50% 100%", // base (feet) pushes off the ground
  };

  // INTRO JUMP (upright): crouch → hop → land → small hop → land
  const introInitial = reduce
    ? { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
    : { x: 240, y: 0, scaleX: 1, scaleY: 1, rotate: 0 };
  const introAnimate = reduce
    ? { x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 }
    : {
        x: [240, 240, 150, 60, 0, -6, 0],
        y: [0, 0, -38, 0, -20, 0, 0],
        scaleX: [1, 0.94, 1.05, 0.96, 1.03, 0.99, 1],
        scaleY: [1, 1.10, 0.95, 1.06, 0.97, 1.02, 1],
        rotate: [0, -4, -6, 0, -3, 0, 0],
      };
  const introTransition = reduce
    ? { duration: 0 }
    : {
        duration: 1.45,
        ease: ["easeOut", "easeIn", "easeOut", "easeIn", "easeOut", "easeOut"],
        times: [0, 0.08, 0.32, 0.62, 0.85, 0.94, 1] as number[],
      };

  // Beam polygon in local +X; whole-lamp rotation orients it
  const beamHalf = beamThick * 0.55;
  const beamPoints = `-1,0 ${beamLen},-${beamHalf} ${beamLen},${beamHalf} -1,0`;

  return (
    <motion.span
      ref={wrapRef}
      aria-hidden
      className="inline-block align-baseline relative"
      style={wrapStyle}
      initial={introInitial}
      animate={introAnimate}
      transition={introTransition}
      onAnimationComplete={() => {
        // End intro: face down, flip to hanging T, then unlock pointer control
        setBarAngle(90);
        setIsFlipped(true);
        setIntroDone(true);
        onSettled?.();
      }}
    >
      {/* Vertical flip happens ONLY after the jump, so it's upright during the hop */}
      <motion.div
        style={{ display: "block", transformOrigin: "50% 50%" }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: isFlipped ? -1 : 1 }}
        transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
      >
        <motion.svg
          ref={svgRef}
          viewBox="0 0 120 140"
          className="block"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0 0% 83%)" />
              <stop offset="100%" stopColor="hsl(0 0% 62%)" />
            </linearGradient>
            <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(42 85% 88%)" />
              <stop offset="100%" stopColor="hsl(42 55% 74%)" />
            </linearGradient>
            <radialGradient id="innerGlow" cx="50%" cy="38%" r="70%">
              <stop offset="0%" stopColor="rgba(255,245,220,0.65)" />
              <stop offset="100%" stopColor="rgba(255,245,220,0)" />
            </radialGradient>
            {/* beam gradients */}
            <linearGradient id="beamCore" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(246,203,150,0.34)" />
              <stop offset="45%" stopColor="rgba(246,203,150,0.22)" />
              <stop offset="100%" stopColor="rgba(246,203,150,0)" />
            </linearGradient>
            <radialGradient id="beamHotspot" cx="100%" cy="50%" r="55%">
              <stop offset="0%" stopColor="rgba(255,244,225,0.62)" />
              <stop offset="28%" stopColor="rgba(246,203,150,0.38)" />
              <stop offset="62%" stopColor="rgba(246,203,150,0)" />
            </radialGradient>
            <filter id="beamBlur" x="-10%" y="-120%" width="140%" height="340%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" />
            </filter>
          </defs>

          {/* Whole lamp rotates as one */}
          <motion.g
            style={{
              transformBox: "view-box",
              transformOrigin: `${BASE_PIVOT.x}px ${BASE_PIVOT.y}px`,
            }}
            animate={
              !introDone
                // Upright intro: rotate 180° (left) → 90° (down) during the jump
                ? { rotate: [180, 135, 90] }
                // After vertical flip: use -angle+180 so "down" stays down
                : { rotate: isFlipped ? -barAngle + 180 : barAngle }
            }
            transition={
              !introDone
                ? {
                    duration: reduce ? 0 : 1.45,
                    ease: ["easeOut", "easeIn", "easeOut"],
                    times: [0, 0.6, 1] as number[],
                  }
                : { type: "spring", stiffness: 100, damping: 16 }
            }
          >
            {/* === BASE + BARS (use barColor/currentColor) === */}
            {/* base plate */}
            <rect x={BASE.x} y={BASE.y} width={BASE.w} height={BASE.h} rx={BASE.rx} fill={barFill} />
            {/* visual pivot screw */}
            <circle cx={BASE_PIVOT.x} cy={BASE_PIVOT.y} r="1.4" fill={barFill} />

            {/* lower arm assembly */}
            <rect x="47" y="106" width="34" height="8" rx="3" fill={barFill} />
            <rect x="60" y="78" width="8" height="30" rx="3" fill={barFill} />
            <circle cx="64" cy="108" r="4" fill={barFill} />

            {/* upper arm + hinge block (BAR SIDE) */}
            <rect x="60" y="54" width="8" height="26" rx="3" fill={barFill} />
            <circle cx="64" cy="54" r="4" fill={barFill} />
            <rect x="64" y={HINGE.y - 3} width="16" height="6" rx="3" fill={barFill} />

            {/* back hinge plate for depth (neutral tone) */}
            <circle cx={HINGE.x} cy={HINGE.y} r="4.6" fill="hsl(0 0% 42%)" opacity="0.55" />

            {/* === HEAD (keeps its own materials) === */}
            {/* U-BRACKET around hinge */}
            <path
              d={`M ${HINGE.x - 2.5} ${HINGE.y - 4.2} h 5 a 4.2 4.2 0 0 1 0 8.4 h -5 a 4.2 4.2 0 0 1 0 -8.4 Z`}
              fill="hsl(42 32% 62%)"
              stroke="hsl(42 28% 40%)"
              strokeWidth="0.8"
              opacity="0.95"
            />
            {/* yoke/link from hinge → neck */}
            <rect
              x={NECK_RIGHT_X}
              y={HINGE.y - 1.6}
              width={HINGE.x - NECK_RIGHT_X}
              height={3.2}
              rx={1.6}
              fill="hsl(42 34% 66%)"
              stroke="hsl(42 28% 40%)"
              strokeWidth="0.6"
            />
            {/* neck + collar */}
            <rect x={NECK_RIGHT_X - 6} y={HINGE.y - 3} width="6" height="6" rx="2" fill="url(#metal)" />
            <ellipse cx={NECK_RIGHT_X} cy={HINGE.y} rx={4.8} ry={5.8} fill="hsl(42 40% 72%)" stroke="hsl(42 30% 38%)" strokeWidth="1" />
            {/* cone */}
            <path
              d={`M${NECK_RIGHT_X} ${HINGE.y - 6} L${TIP.x} ${TIP.y} L${NECK_RIGHT_X} ${HINGE.y + 6} Z`}
              fill="url(#cone)"
              stroke="hsl(42 35% 45%)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* interior glow */}
            <ellipse cx="92" cy="46" rx="14" ry="9" fill="url(#innerGlow)" opacity="0.55" />

            {/* BEAM (under rim) */}
            <g transform={`translate(${TIP.x} ${TIP.y})`} style={{ mixBlendMode: "multiply" as any }}>
              <polygon points={beamPoints} fill="url(#beamCore)" filter="url(#beamBlur)" />
              <rect
                x={-1}
                y={-beamThick / 2}
                width={beamLen + 1}
                height={beamThick}
                fill="url(#beamHotspot)"
                filter="url(#beamBlur)"
              />
            </g>

            {/* nozzle + foreground hinge cap */}
            <rect x={TIP.x - 3.6} y={TIP.y - 2.2} width={3.6} height={4.4} rx={1.5} fill="hsl(42 42% 76%)" stroke="hsl(42 30% 42%)" strokeWidth="0.8" />
            <circle cx={TIP.x} cy={TIP.y} r="3.4" fill="hsl(42 40% 70%)" stroke="hsl(42 30% 38%)" strokeWidth="1" />
            <circle ref={nozzleRef} cx={TIP.x} cy={TIP.y} r={0.8} fill="transparent" />
            <circle cx={HINGE.x} cy={HINGE.y} r="3.8" fill="hsl(0 0% 90%)" stroke="hsl(0 0% 28%)" strokeWidth="0.9" />
          </motion.g>
        </motion.svg>
      </motion.div>
    </motion.span>
  );
}
