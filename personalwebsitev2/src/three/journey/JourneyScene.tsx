import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, Group, InstancedMesh, Object3D } from "three";
import { Clouds, Skyline } from "./scenery";
import { damp } from "maath/easing";
import SceneCanvas from "../SceneCanvas";
import { makeAsphaltTexture, makeSkyTexture, mulberry32 } from "./textures";
import { palette } from "../lib/palette";
import type { Checkpoint } from "@/data/journey";
import { cn } from "@/lib/utils";

/** Length of the road in world units; progress 0..1 maps onto it. */
export const ROAD_LEN = 64;
const ROAD_Z = 0.4;
const ROAD_W = 4.6;
const SIGN_Z = -2.6;

type Props = {
  className?: string;
  progressRef: MutableRefObject<number>;
  checkpoints: Checkpoint[];
  activeIndex: number;
  onSignClick: (cp: Checkpoint, index: number) => void;
  mobile: boolean;
  fallback?: ReactNode;
};

export default function JourneyScene({ className, progressRef, checkpoints, activeIndex, onSignClick, mobile, fallback }: Props) {
  return (
    <SceneCanvas
      className={className}
      fallback={fallback}
      shadows={!mobile}
      dpr={mobile ? [1, 1.25] : [1, 1.5]}
      camera={{ fov: mobile ? 46 : 38, position: [1.4, 2.6, mobile ? 12.5 : 9.5], near: 0.1, far: 120 }}
    >
      <JourneyContent progressRef={progressRef} checkpoints={checkpoints} activeIndex={activeIndex} onSignClick={onSignClick} mobile={mobile} />
    </SceneCanvas>
  );
}

function JourneyContent({ progressRef, checkpoints, activeIndex, onSignClick, mobile }: Omit<Props, "className" | "fallback">) {
  const world = useRef<Group>(null);
  const far = useRef<Group>(null);
  const near = useRef<Group>(null);
  const camera = useThree((s) => s.camera);
  const colors = useMemo(
    () => ({
      cream: palette.cream(),
      sage: palette.sage(),
      softBlue: palette.softBlue(),
      sky: palette.sky(),
    }),
    []
  );

  useEffect(() => {
    camera.lookAt(0.9, 0.8, 0);
  }, [camera]);

  const smooth = useRef(0);
  useFrame((_, dt) => {
    // smooth the raw wheel input a little
    damp(smooth, "current", progressRef.current, 0.12, dt);
    const x = smooth.current * ROAD_LEN;
    if (world.current) world.current.position.x = -x;
    if (far.current) far.current.position.x = -x * 0.18;
    if (near.current) near.current.position.x = -x * 0.42;
  });

  return (
    <>
      <fog attach="fog" args={[colors.cream.getStyle(), 22, 75]} />
      <hemisphereLight color={colors.sky} groundColor={colors.cream} intensity={0.9} />
      <directionalLight
        position={[6, 9, 6]}
        intensity={2.2}
        color="#fff4e0"
        castShadow={!mobile}
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={10}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      <Sky />
      <Ground />

      <group ref={far}>
        <Skyline seed={3} count={mobile ? 40 : 90} z={-18} spread={ROAD_LEN * 0.18 + 70} hMin={6} hMax={46} color="#b9cbd8" />
      </group>
      <group ref={near}>
        <Skyline seed={11} count={mobile ? 24 : 55} z={-10} spread={ROAD_LEN * 0.42 + 60} hMin={2} hMax={18} color="#c8d6cd" />
      </group>

      <group ref={world}>
        <Road />
        <Trees count={mobile ? 22 : 44} />
        {checkpoints.map((cp, i) => (
          <Signpost key={cp.id} cp={cp} index={i} active={i === activeIndex} onClick={() => onSignClick(cp, i)} />
        ))}
      </group>

      <Car progressRef={smooth} />
      <Clouds />
    </>
  );
}

/* ---------------------------------------------------------------------- */

function Sky() {
  const tex = useMemo(() => makeSkyTexture("#8fcbe0", "#dbeef4", "#f6f3ec"), []);
  return (
    <mesh position={[0, 16, -70]}>
      <planeGeometry args={[320, 90]} />
      <meshBasicMaterial map={tex} fog={false} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -10]} receiveShadow>
      <planeGeometry args={[600, 120]} />
      <meshStandardMaterial color="#dfe8dc" roughness={1} />
    </mesh>
  );
}

function Road() {
  const asphalt = useMemo(() => {
    const t = makeAsphaltTexture();
    t.repeat.set((ROAD_LEN + 80) / 2.2, 2);
    return t;
  }, []);
  const dashes = useRef<InstancedMesh>(null);
  const count = Math.floor((ROAD_LEN + 80) / 2.4);

  useEffect(() => {
    const m = dashes.current;
    if (!m) return;
    const o = new Object3D();
    for (let i = 0; i < count; i++) {
      o.position.set(-40 + i * 2.4, 0.004, ROAD_Z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD_LEN / 2, 0, ROAD_Z]} receiveShadow>
        <planeGeometry args={[ROAD_LEN + 80, ROAD_W]} />
        <meshStandardMaterial map={asphalt} roughness={0.95} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* kerbs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[ROAD_LEN / 2, 0.03, ROAD_Z + (s * (ROAD_W + 0.18)) / 2]} receiveShadow>
          <boxGeometry args={[ROAD_LEN + 80, 0.07, 0.18]} />
          <meshStandardMaterial color="#e8e2d3" roughness={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={dashes} args={[undefined, undefined, count]}>
        <boxGeometry args={[1.1, 0.01, 0.1]} />
        <meshStandardMaterial color="#f5e7a8" emissive="#f5e7a8" emissiveIntensity={0.25} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

function Trees({ count }: { count: number }) {
  const trunks = useRef<InstancedMesh>(null);
  const crowns = useRef<InstancedMesh>(null);
  useEffect(() => {
    const t = trunks.current;
    const c = crowns.current;
    if (!t || !c) return;
    const rnd = mulberry32(21);
    const o = new Object3D();
    const col = new Color();
    for (let i = 0; i < count; i++) {
      const x = -20 + (i / count) * (ROAD_LEN + 40) + (rnd() - 0.5) * 2.5;
      const side = rnd() > 0.85 ? 1 : -1; // mostly on the far side
      const z = side < 0 ? -4.2 - rnd() * 2.6 : ROAD_Z + ROAD_W / 2 + 1.1 + rnd() * 0.6;
      // near-side trees sit close to the camera, keep them small
      const s = side < 0 ? 0.7 + rnd() * 0.8 : 0.35 + rnd() * 0.2;
      o.position.set(x, 0.45 * s, z);
      o.scale.set(s, s, s);
      o.rotation.set(0, rnd() * Math.PI, 0);
      o.updateMatrix();
      t.setMatrixAt(i, o.matrix);
      o.position.y = 1.35 * s;
      o.updateMatrix();
      c.setMatrixAt(i, o.matrix);
      col.setHSL(0.36 + rnd() * 0.06, 0.32, 0.5 + rnd() * 0.12);
      c.setColorAt(i, col);
    }
    t.instanceMatrix.needsUpdate = true;
    c.instanceMatrix.needsUpdate = true;
    if (c.instanceColor) c.instanceColor.needsUpdate = true;
  }, [count]);
  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.9, 8]} />
        <meshStandardMaterial color="#8a6f57" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[0.55, 1.5, 9]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
    </>
  );
}

/* ---------------------------------------------------------------------- */

function Car({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const body = useRef<Group>(null);
  const wheels = useRef<Group[]>([]);
  const prev = useRef(0);
  const colors = useMemo(() => ({ paint: palette.primary(), dark: palette.slate() }), []);
  const R = 0.24;

  useFrame(({ clock }) => {
    const x = progressRef.current * ROAD_LEN;
    const dx = x - prev.current;
    prev.current = x;
    const spin = dx / R;
    wheels.current.forEach((w) => {
      if (w) w.rotation.z -= spin;
    });
    if (body.current) {
      body.current.position.y = 0.02 + Math.sin(clock.elapsedTime * 7) * 0.008 + Math.min(Math.abs(dx) * 0.4, 0.03);
      body.current.rotation.z = -dx * 1.4;
    }
  });

  const wheelPositions: [number, number, number][] = [
    [-0.62, R, 0.42],
    [0.62, R, 0.42],
    [-0.62, R, -0.42],
    [0.62, R, -0.42],
  ];

  return (
    <group position={[0, 0, ROAD_Z + 0.9]}>
      <group ref={body}>
        {/* chassis */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.9, 0.42, 0.95]} />
          <meshStandardMaterial color={colors.paint} metalness={0.25} roughness={0.35} />
        </mesh>
        {/* cabin */}
        <mesh position={[-0.12, 0.88, 0]} castShadow>
          <boxGeometry args={[1.05, 0.42, 0.85]} />
          <meshStandardMaterial color={colors.paint} metalness={0.25} roughness={0.35} />
        </mesh>
        {/* glass */}
        <mesh position={[-0.12, 0.9, 0]}>
          <boxGeometry args={[1.07, 0.26, 0.87]} />
          <meshStandardMaterial color="#cfe3f0" metalness={0.6} roughness={0.15} transparent opacity={0.85} />
        </mesh>
        {/* headlights */}
        {[0.28, -0.28].map((z) => (
          <mesh key={z} position={[0.96, 0.52, z]}>
            <boxGeometry args={[0.04, 0.12, 0.22]} />
            <meshStandardMaterial color="#fff6cc" emissive="#ffe9a8" emissiveIntensity={1.6} />
          </mesh>
        ))}
        {/* tail lights */}
        {[0.3, -0.3].map((z) => (
          <mesh key={z} position={[-0.96, 0.52, z]}>
            <boxGeometry args={[0.03, 0.1, 0.18]} />
            <meshStandardMaterial color="#c0392b" emissive="#e74c3c" emissiveIntensity={0.7} />
          </mesh>
        ))}
        <spotLight position={[1.0, 0.55, 0]} target-position={[6, 0, 0]} angle={0.45} penumbra={0.7} intensity={12} distance={9} color="#fff1c4" />
      </group>
      {wheelPositions.map((p, i) => (
        <group key={i} position={p} ref={(el) => el && (wheels.current[i] = el)}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[R, R, 0.16, 20]} />
            <meshStandardMaterial color="#232529" roughness={0.9} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[R * 0.58, R * 0.58, 0.17, 12]} />
            <meshStandardMaterial color="#c9cbd2" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Signpost({ cp, index, active, onClick }: { cp: Checkpoint; index: number; active: boolean; onClick: () => void }) {
  const board = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!board.current) return;
    const s = active ? 1.12 : 1;
    damp(board.current.scale, "x", s, 0.2, dt);
    damp(board.current.scale, "y", s, 0.2, dt);
    damp(board.current.scale, "z", s, 0.2, dt);
  });
  const x = cp.t * ROAD_LEN;
  return (
    <group position={[x, 0, SIGN_Z]}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 2.3, 10]} />
        <meshStandardMaterial color="#8d939c" metalness={0.5} roughness={0.5} />
      </mesh>
      <group ref={board} position={[0, 2.45, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.7, 0.95, 0.06]} />
          <meshStandardMaterial color={active ? "#2f7a4a" : "#3c6b4b"} roughness={0.55} emissive="#2f7a4a" emissiveIntensity={active ? 0.35 : 0} />
        </mesh>
        <mesh position={[0, 0, 0.032]}>
          <boxGeometry args={[1.58, 0.83, 0.005]} />
          <meshStandardMaterial color="#f7f5ee" roughness={0.6} />
        </mesh>
        <Html transform occlude={false} distanceFactor={4.2} position={[0, 0, 0.04]} center zIndexRange={[50, 0]} style={{ pointerEvents: "none" }}>
          <button
            onClick={onClick}
            className={cn(
              "pointer-events-auto flex w-[150px] flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-center font-raleway transition-transform duration-200 hover:scale-105 active:scale-95",
              active ? "text-primary-dark" : "text-slate"
            )}
            style={{ cursor: "pointer" }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-sage">Milestone {index + 1}</span>
            <span className="text-[15px] font-extrabold leading-tight">{cp.short}</span>
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground">tap to read</span>
          </button>
        </Html>
      </group>
    </group>
  );
}
