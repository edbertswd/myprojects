import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Html, Sparkles } from "@react-three/drei";
import { Group, Vector3 } from "three";
import { damp } from "maath/easing";
import SceneCanvas from "../SceneCanvas";
import { usePointerNDC } from "../hooks/usePointerNDC";
import { palette } from "../lib/palette";
import { cn } from "@/lib/utils";

/** Evenly distributed points on a sphere. */
function fibonacciSphere(n: number, radius: number): Vector3[] {
  const pts: Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push(new Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }
  return pts;
}

type Props = {
  skills: string[];
  className?: string;
};

/* Note: no `eventSource` here — drei's <Html> portals into it when set, which
   would position the chips relative to the section instead of the canvas. */
export default function TechCloud({ skills, className }: Props) {
  return (
    <SceneCanvas className={className} dpr={[1, 1.5]} camera={{ fov: 42, position: [0, 0, 7.6] }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <Cloud skills={skills} />
    </SceneCanvas>
  );
}

function Cloud({ skills }: { skills: string[] }) {
  const group = useRef<Group>(null);
  const pointer = usePointerNDC();
  const [hovered, setHovered] = useState<number | null>(null);
  const points = useMemo(() => fibonacciSphere(skills.length, 2.55), [skills.length]);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sage = useMemo(() => palette.sage(), []);
  const tmp = useMemo(() => new Vector3(), []);
  const hoveredRef = useRef<number | null>(null);
  hoveredRef.current = hovered;

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const pt = pointer.current;
    const slow = hoveredRef.current !== null ? 0.02 : 0.14;
    g.rotation.y += dt * slow;
    damp(g.rotation, "x", pt.active ? -pt.y * 0.35 : Math.sin(clock.elapsedTime * 0.3) * 0.1, 0.5, dt);
    damp(g.rotation, "z", pt.active ? pt.x * 0.18 : 0, 0.6, dt);

    // depth fade: chips at the back get smaller and fainter
    g.updateMatrixWorld();
    points.forEach((p, i) => {
      const el = chipRefs.current[i];
      if (!el) return;
      tmp.copy(p).applyMatrix4(g.matrixWorld);
      const depth = (tmp.z + 2.55) / 5.1; // 0 back … 1 front
      const isHover = hoveredRef.current === i;
      el.style.opacity = String(isHover ? 1 : 0.25 + depth * 0.75);
      el.style.transform = `scale(${isHover ? 1.18 : 0.72 + depth * 0.4})`;
    });
  });

  useEffect(() => {
    chipRefs.current.length = points.length;
  }, [points.length]);

  return (
    <group>
      <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.5}>
        <group ref={group}>
          {/* core */}
          <mesh>
            <icosahedronGeometry args={[1.05, 1]} />
            <meshStandardMaterial color={sage} wireframe transparent opacity={0.35} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.55, 32, 32]} />
            <meshStandardMaterial color={sage} roughness={0.3} metalness={0.2} emissive={sage} emissiveIntensity={0.25} />
          </mesh>
          <Sparkles count={40} scale={6} size={2.2} speed={0.25} color="#8fb59a" opacity={0.7} />

          {points.map((p, i) => (
            <Html key={skills[i]} position={p} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
              <div
                ref={(el) => {
                  chipRefs.current[i] = el;
                }}
                className="will-change-transform"
                style={{ transition: "opacity 120ms linear" }}
              >
                <span
                  onPointerEnter={() => setHovered(i)}
                  onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
                  className={cn(
                    "pointer-events-auto inline-block cursor-default select-none whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-card transition-colors duration-200",
                    hovered === i
                      ? "border-primary bg-primary text-white"
                      : "border-white/60 bg-white/85 text-slate backdrop-blur-sm"
                  )}
                >
                  {skills[i]}
                </span>
              </div>
            </Html>
          ))}
        </group>
      </Float>
    </group>
  );
}
