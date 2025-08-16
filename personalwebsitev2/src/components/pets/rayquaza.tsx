import { motion } from "motion/react";
import rayquazaBall from "@/assets/rayquaza-ball.png";
import React, { useMemo } from "react";

type Props = {
  duration?: number;      // seconds per pass 
  delay?: number;         // seconds to stagger starts
  topOffset?: string;     // keep below navbar 
  zIndexClass?: string;   
  amplitudeVH?: number;   // sine amplitude
  baselineVH?: number;    // vertical centerline
  waves?: number;         // sine cycles per pass
  samples?: number;       // keyframe samples (higher = smoother)
  tiltDeg?: number;       // banking angle
};

const FlyingRayquaza = ({
  duration = 5,          // faster
  delay = 0,
  topOffset = "5rem",
  zIndexClass = "z-60",
  amplitudeVH = 10,
  baselineVH = 60,
  waves = 1.75,
  samples = 100,
  tiltDeg = 10,
}: Props) => {
  const { xKeys, yKeys, rotKeys, times } = useMemo(() => {
    const xs: string[] = [];
    const ys: string[] = [];
    const rs: number[] = [];
    const ts: number[] = [];

    // Start just barely offscreen so it appears quickly
    const startVW = -5;
    const endVW = 120;
    const dx = endVW - startVW;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const xvw = startVW + dx * t;
      const phase = 2 * Math.PI * waves * t;
      const yvh = baselineVH + amplitudeVH * Math.sin(phase);
      const bank = tiltDeg * Math.cos(phase); // tilt with slope

      xs.push(`${xvw}vw`);
      ys.push(`${yvh}vh`);
      rs.push(bank);
      ts.push(t);
    }

    return { xKeys: xs, yKeys: ys, rotKeys: rs, times: ts };
  }, [amplitudeVH, baselineVH, waves, samples, tiltDeg]);

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 ${zIndexClass}`}
      style={{ top: topOffset }}
      aria-hidden
    >
      <motion.img
        src={rayquazaBall}
        alt=""
        className="w-24 h-24 object-contain"
        style={{ willChange: "transform", opacity: 1 }}
        // Start on-screen so you see it immediately
        initial={{ x: "-5vw", y: `${baselineVH}vh`, rotate: 0 }}
        animate={{ x: xKeys, y: yKeys, rotate: rotKeys }}
        transition={{
          duration,
          delay,
          ease: "linear",      // constant speed
          times,
          repeat: Infinity,
          repeatType: "loop",
        }}
        draggable={false}
      />
    </div>
  );
};

export default FlyingRayquaza;
