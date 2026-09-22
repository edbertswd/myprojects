import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, Object3D } from "three";
import { mulberry32 } from "./textures";

/** Instanced low-poly skyline. Shared by the hero backdrop and the journey. */
export function Skyline({ seed, count, z, spread, hMin, hMax, color, baseY = -0.05, xStart = -30, depth = 6 }: { seed: number; count: number; z: number; spread: number; hMin: number; hMax: number; color: string; baseY?: number; xStart?: number; depth?: number }) {
  const ref = useRef<InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const rnd = mulberry32(seed);
    const o = new Object3D();
    const base = new Color(color);
    const tint = new Color();
    for (let i = 0; i < count; i++) {
      const w = 1.2 + rnd() * 3.2;
      const h = hMin + Math.pow(rnd(), 1.25) * (hMax - hMin);
      const d = 1.5 + rnd() * 2.5;
      o.position.set(xStart + rnd() * spread, baseY + h / 2, z - rnd() * depth);
      o.scale.set(w, h, d);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      tint.copy(base).offsetHSL(0, 0, (rnd() - 0.5) * 0.12);
      m.setColorAt(i, tint);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [seed, count, z, spread, hMin, hMax, color, baseY, xStart, depth]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/** Drifting instanced clouds. */
export function Clouds({ count = 14, yMin = 7, ySpan = 6, zMin = -26, zSpan = 20, opacity = 0.85 }: { count?: number; yMin?: number; ySpan?: number; zMin?: number; zSpan?: number; opacity?: number } = {}) {
  const ref = useRef<InstancedMesh>(null);
  const data = useMemo(() => {
    const rnd = mulberry32(5);
    return Array.from({ length: count }, () => ({
      x: -30 + rnd() * 60,
      y: yMin + rnd() * ySpan,
      z: zMin - rnd() * zSpan,
      sx: 2 + rnd() * 3.5,
      sy: 0.7 + rnd() * 0.6,
      speed: 0.15 + rnd() * 0.25,
    }));
  }, [count, yMin, ySpan, zMin, zSpan]);
  const o = useMemo(() => new Object3D(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    data.forEach((d, i) => {
      const x = (((d.x + t * d.speed + 40) % 80) + 80) % 80 - 40;
      o.position.set(x, d.y, d.z);
      o.scale.set(d.sx, d.sy, d.sy);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={opacity} fog={false} />
    </instancedMesh>
  );
}
