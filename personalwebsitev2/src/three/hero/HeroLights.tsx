import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { AmbientLight, Color, DirectionalLight, HemisphereLight } from "three";
import { createTweenScope, ease, lerp } from "../lib/tween";
import { palette } from "../lib/palette";
import { isRevealed, type HeroPhase } from "./heroPhase";

type Levels = { ambient: number; hemi: number; key: number; fill: number; clear: number };

const DARK: Levels = { ambient: 0.12, hemi: 0.22, key: 0, fill: 0, clear: 1 };
const LIT: Levels = { ambient: 0.55, hemi: 0.7, key: 1.9, fill: 0.7, clear: 0 };

/**
 * Scene lighting + backdrop. In the dark phases the canvas clears to opaque
 * black (so the spotlight reveal is real); on reveal the clear alpha fades to
 * 0 and the cream page shows through.
 */
export default function HeroLights({ phase, reduced }: { phase: HeroPhase; reduced: boolean }) {
  const gl = useThree((s) => s.gl);
  const ambient = useRef<AmbientLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);

  const levels = useRef<Levels>({ ...(reduced ? LIT : DARK) });
  const black = useMemo(() => new Color("#000000"), []);
  const colors = useMemo(
    () => ({
      sky: palette.sky(),
      ground: palette.cream(),
      key: new Color("#fff6e6"),
      fill: palette.softBlue(),
    }),
    []
  );

  useEffect(() => {
    gl.setClearColor(black, levels.current.clear);
  }, [gl, black]);

  useEffect(() => {
    const revealed = isRevealed(phase) || reduced;
    const to = revealed ? LIT : DARK;
    const from = { ...levels.current };
    const scope = createTweenScope();
    scope.run({
      duration: revealed ? 1.1 : 0.4,
      ease: ease.inOutSine,
      onUpdate: (t) => {
        const l = levels.current;
        l.ambient = lerp(from.ambient, to.ambient, t);
        l.hemi = lerp(from.hemi, to.hemi, t);
        l.key = lerp(from.key, to.key, t);
        l.fill = lerp(from.fill, to.fill, t);
        l.clear = lerp(from.clear, to.clear, t);
      },
    });
    return () => scope.dispose();
  }, [phase, reduced]);

  useFrame(() => {
    const l = levels.current;
    if (ambient.current) ambient.current.intensity = l.ambient;
    if (hemi.current) hemi.current.intensity = l.hemi;
    if (key.current) key.current.intensity = l.key;
    if (fill.current) fill.current.intensity = l.fill;
    gl.setClearColor(black, l.clear);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.12} />
      <hemisphereLight ref={hemi} color={colors.sky} groundColor={colors.ground} intensity={0.22} />
      <directionalLight ref={key} color={colors.key} position={[4, 6, 5]} intensity={0} />
      <directionalLight ref={fill} color={colors.fill} position={[-5, 2, 3]} intensity={0} />
      {/* Offline studio environment built from light formers (no HDR download) */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={1.2} rotation-x={Math.PI / 2} position={[0, 5, -6]} scale={[10, 10, 1]} color="#fff6e6" />
        <Lightformer intensity={0.8} rotation-y={Math.PI / 2} position={[-6, 2, 0]} scale={[6, 3, 1]} color="#dbe9f2" />
        <Lightformer intensity={0.6} rotation-y={-Math.PI / 2} position={[6, 1, 0]} scale={[6, 3, 1]} color="#e9e4d2" />
      </Environment>
    </>
  );
}
